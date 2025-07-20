import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from "pdf-lib";
import ApexCharts from "apexcharts";

// Ensure ApexCharts is available globally for exec
(window as Window & { ApexCharts?: typeof ApexCharts }).ApexCharts = ApexCharts;

export interface ReportType {
  id: number;
  filename: string;
  uploaded_at: string;
  file_size_mb: number;
  uploaded_by: string;
  pdf_data: {
    athlete_name: string;
    report_date: string;
    submissions: string[];
    match_types: string[];
    points: string[];
    "win/loss_ratio": string[];
    graph_data: {
      defense_attempts: { labels: string[]; values: number[] };
      offense_attempts: { labels: string[]; values: number[] };
      defense_successes: { labels: string[]; values: number[] };
      offense_successes: { labels: string[]; values: number[] };
    };
    final_summary: {
      text: string;
      disclaimer?: string;
    };
    defensive_analysis: {
      attempted: string;
      successful: string;
    };
    offensive_analysis: {
      attempted: string;
      successful: string;
    };
  };
}

function dataUriToBytes(dataUri: string): Uint8Array {
  const base64 = dataUri.split(",")[1];
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

export async function generateReportPdf(report: ReportType): Promise<void> {
  const chartIds = {
    offenseSuccess: "offense-successes-chart",
    offenseAttempts: "offense-attempts-chart",
    defenseSuccess: "defense-successes-chart",
    defenseAttempts: "defense-attempts-chart",
  };

  async function getChartDataUri(chartId: string): Promise<string> {
    const ApexChartsGlobal = (
      window as Window & { ApexCharts?: typeof ApexCharts }
    ).ApexCharts;
    if (!ApexChartsGlobal)
      throw new Error("ApexCharts is not available on window");
    const result = await ApexChartsGlobal.exec(chartId, "dataURI");
    return result.imgURI;
  }

  // Get all chart images
  const [
    offenseSuccessImg,
    offenseAttemptsImg,
    defenseSuccessImg,
    defenseAttemptsImg,
  ] = await Promise.all([
    getChartDataUri(chartIds.offenseSuccess),
    getChartDataUri(chartIds.offenseAttempts),
    getChartDataUri(chartIds.defenseSuccess),
    getChartDataUri(chartIds.defenseAttempts),
  ]);

  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595, 842]); // A4
  let y = 800;
  const left = 50;
  const right = 545;
  const lineHeight = 20;
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Helper function to check if new page is needed
  function checkNewPage(requiredSpace: number = 40): void {
    if (y < requiredSpace) {
      page = pdfDoc.addPage([595, 842]);
      y = 800;
    }
  }

  // Add section title with more spacing
  function addSectionTitle(title: string): void {
    checkNewPage(80);
    y -= lineHeight * 0.5; // Add space before section title
    page.drawText(title, {
      x: left,
      y,
      size: 14,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.6),
    });
    y -= lineHeight * 1.5; // More space after title
  }

  // Add bullet points with proper text wrapping
  function addBullets(items: string[]): void {
    for (const item of items) {
      const bulletLines = wrapText(`• ${item}`, right - left - 20, 11, font);
      let isFirstLine = true;

      for (const line of bulletLines) {
        checkNewPage();
        const xPos = isFirstLine ? left + 10 : left + 20; // Indent continuation lines
        page.drawText(line.replace("• ", isFirstLine ? "• " : ""), {
          x: xPos,
          y,
          size: 11,
          font,
        });
        y -= lineHeight * 0.9;
        isFirstLine = false;
      }
    }
    y -= lineHeight * 1.2; // More spacing after section
  }

  // Add numbered list with proper text wrapping
  function addNumbered(items: string[]): void {
    items.forEach((item, idx) => {
      const numberedLines = wrapText(
        `${idx + 1}. ${item}`,
        right - left - 20,
        11,
        font
      );
      let isFirstLine = true;

      for (const line of numberedLines) {
        checkNewPage();
        const xPos = isFirstLine ? left + 10 : left + 25; // Indent continuation lines more
        page.drawText(
          line.replace(`${idx + 1}. `, isFirstLine ? `${idx + 1}. ` : ""),
          {
            x: xPos,
            y,
            size: 11,
            font,
          }
        );
        y -= lineHeight * 0.9;
        isFirstLine = false;
      }
    });
    y -= lineHeight * 1.2; // More spacing after section
  }

  // Add chart section with image and analysis
  async function addChartSection(
    title: string,
    img: string,
    analysis: string
  ): Promise<void> {
    addSectionTitle(title);

    try {
      const imageBytes = dataUriToBytes(img);
      const pngImage = await pdfDoc.embedPng(imageBytes);
      const imgDims = pngImage.scale(0.45); // Slightly smaller for better fit

      checkNewPage(imgDims.height + 80);

      page.drawImage(pngImage, {
        x: left,
        y: y - imgDims.height,
        width: imgDims.width,
        height: imgDims.height,
      });

      y -= imgDims.height + 15;

      // Add "Key Takeaway" subtitle
      page.drawText("Key Takeaway", {
        x: left,
        y,
        size: 12,
        font: boldFont,
        color: rgb(0.3, 0.3, 0.3),
      });
      y -= lineHeight;

      // Add analysis text with proper wrapping
      const analysisLines = wrapText(analysis, right - left, 11, font);
      for (const line of analysisLines) {
        checkNewPage();
        page.drawText(line, {
          x: left,
          y,
          size: 11,
          font,
          color: rgb(0.2, 0.2, 0.2),
        });
        y -= lineHeight * 0.9;
      }

      y -= lineHeight * 1.5; // More spacing after chart section
    } catch (error) {
      console.error(`Error adding chart ${title}:`, error);
      // Continue without the chart if there's an error
      page.drawText(`[Chart could not be loaded: ${title}]`, {
        x: left,
        y,
        size: 11,
        font,
        color: rgb(0.8, 0.2, 0.2),
      });
      y -= lineHeight * 2;
    }
  }

  // Text wrapping function
  function wrapText(
    text: string,
    maxWidth: number,
    size: number,
    font: PDFFont
  ): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let current = "";

    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) > maxWidth) {
        if (current) {
          lines.push(current);
          current = word;
        } else {
          // Handle very long words
          lines.push(word);
          current = "";
        }
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  // === PDF CONTENT GENERATION ===

  // Title and Header Information
  page.drawText(`Jiu-Jitsu Athlete Performance Analysis`, {
    x: left,
    y,
    size: 20,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= lineHeight * 1.8;

  page.drawText(`Athlete: ${report.pdf_data.athlete_name}`, {
    x: left,
    y,
    size: 14,
    font: boldFont,
  });
  y -= lineHeight;

  page.drawText(
    `Report Date: ${
      report.pdf_data.report_date ||
      new Date(report.uploaded_at).toLocaleDateString()
    }`,
    { x: left, y, size: 12, font }
  );
  y -= lineHeight * 1.8;

  // Submissions Section
  addSectionTitle("Submissions");
  addBullets(report.pdf_data.submissions);

  // Match Types Section
  addSectionTitle("Match Types");
  addBullets(report.pdf_data.match_types);

  // Win/Loss Ratio Section
  addSectionTitle("Win/Loss Ratio");
  addBullets(report.pdf_data["win/loss_ratio"]);

  // Points Section
  addSectionTitle("Points");
  addBullets(report.pdf_data.points); // Changed from addNumbered to addBullets to match sample PDF

  // Charts Sections
  await addChartSection(
    "Offensive Move Analysis",
    offenseSuccessImg,
    report.pdf_data.offensive_analysis.successful
  );

  await addChartSection(
    "Offensive Attempts",
    offenseAttemptsImg,
    report.pdf_data.offensive_analysis.attempted
  );

  await addChartSection(
    "Defensive Move Analysis",
    defenseSuccessImg,
    report.pdf_data.defensive_analysis.successful
  );

  await addChartSection(
    "Defensive Attempts",
    defenseAttemptsImg,
    report.pdf_data.defensive_analysis.attempted
  );

  // Final Analysis & Recommendation Section
  addSectionTitle("Final Analysis & Recommendation");

  const summaryLines = wrapText(
    report.pdf_data.final_summary.text,
    right - left,
    11,
    font
  );

  for (const line of summaryLines) {
    checkNewPage();
    page.drawText(line, { x: left, y, size: 11, font });
    y -= lineHeight * 0.9;
  }

  // Add disclaimer if present
  if (report.pdf_data.final_summary.disclaimer) {
    y -= lineHeight * 1.0; // More space before disclaimer
    const disclaimerLines = wrapText(
      report.pdf_data.final_summary.disclaimer,
      right - left,
      9,
      font
    );

    for (const line of disclaimerLines) {
      checkNewPage();
      page.drawText(line, {
        x: left,
        y,
        size: 9,
        font,
        color: rgb(0.7, 0.2, 0.2),
      });
      y -= lineHeight * 0.8;
    }
  }

  // Generate and download PDF
  try {
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.href = url;
    link.download = `${report.pdf_data.athlete_name.replace(
      /\s+/g,
      "_"
    )}_Jiu_Jitsu_Report.pdf`;

    // Ensure the link is added to DOM for download to work in all browsers
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the object URL
    URL.revokeObjectURL(url);

    console.log("PDF generated successfully!");
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate PDF report");
  }
}
