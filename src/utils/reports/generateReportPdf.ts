import { PDFDocument, rgb, StandardFonts, PDFFont } from "pdf-lib";
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

    try {
      const result = await ApexChartsGlobal.exec(chartId, "dataURI");
      return result.imgURI;
    } catch (error) {
      console.warn(`Failed to get chart data for ${chartId}:`, error);
      throw new Error(`Chart ${chartId} could not be rendered`);
    }
  }

  try {
    // Get all chart images with error handling
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

    // Page margins and padding
    const topPadding = 60; // Top padding from page edge
    const bottomPadding = 60; // Bottom padding from page edge
    const leftPadding = 50; // Left padding from page edge
    const rightPadding = 50; // Right padding from page edge

    let y = 840 - topPadding; // Start from top with padding
    const left = leftPadding;
    const right = 595 - rightPadding;
    const lineHeight = 20;
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Helper function to check if new page is needed
    function checkNewPage(requiredSpace: number = 40): void {
      if (y < bottomPadding + requiredSpace) {
        page = pdfDoc.addPage([595, 842]);
        y = 842 - topPadding; // Reset to top with padding
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
      if (!items || items.length === 0) {
        page.drawText("• No data available", {
          x: left + 10,
          y,
          size: 11,
          font,
          color: rgb(0.5, 0.5, 0.5),
        });
        y -= lineHeight * 1.2;
        return;
      }

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

    // Add chart section with image and analysis
    async function addChartSection(
      title: string,
      img: string,
      analysis: string
    ): Promise<void> {
      // Start each chart section on a new page with padding
      page = pdfDoc.addPage([595, 842]);
      y = 842 - topPadding; // Start from top with padding

      addSectionTitle(title);

      try {
        const imageBytes = dataUriToBytes(img);
        const pngImage = await pdfDoc.embedPng(imageBytes);

        // Calculate dimensions to fit exactly within PDF page width
        const availableWidth = right - left; // Available width on page (595 - 100 = 495)
        const maxHeight = 300; // Maximum height for charts

        const originalWidth = pngImage.width;
        const originalHeight = pngImage.height;
        const aspectRatio = originalHeight / originalWidth;

        // Fit to width first
        let imgWidth = availableWidth;
        let imgHeight = availableWidth * aspectRatio;

        // If height exceeds max, scale down to fit height instead
        if (imgHeight > maxHeight) {
          imgHeight = maxHeight;
          imgWidth = maxHeight / aspectRatio;
        }

        checkNewPage(imgHeight + 80);

        // Center the image if it doesn't fill the full width
        const xPosition = left + (availableWidth - imgWidth) / 2;

        page.drawImage(pngImage, {
          x: xPosition,
          y: y - imgHeight,
          width: imgWidth,
          height: imgHeight,
        });

        y -= imgHeight + 15;

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
        if (analysis && analysis.trim()) {
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
        } else {
          page.drawText("No analysis available for this chart.", {
            x: left,
            y,
            size: 11,
            font,
            color: rgb(0.5, 0.5, 0.5),
          });
          y -= lineHeight;
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
      if (!text || text.trim() === "") return [""];

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
      color: rgb(0.2, 0.2, 0.6),
    });
    y -= lineHeight * 1.8;

    page.drawText(`Athlete: ${report.pdf_data.athlete_name || "Unknown"}`, {
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
    addBullets(report.pdf_data.points);

    // Charts Sections - Each on new pages as specified
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

    // Final Analysis & Recommendation Section - Start on new page
    page = pdfDoc.addPage([595, 842]);
    y = 800;

    addSectionTitle("Final Analysis & Recommendation");

    if (
      report.pdf_data.final_summary.text &&
      report.pdf_data.final_summary.text.trim()
    ) {
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
    } else {
      page.drawText("No final analysis provided.", {
        x: left,
        y,
        size: 11,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });
      y -= lineHeight;
    }

    // Add disclaimer if present
    if (
      report.pdf_data.final_summary.disclaimer &&
      report.pdf_data.final_summary.disclaimer.trim()
    ) {
      y -= lineHeight * 1.0; // More space before disclaimer

      // Add disclaimer header
      page.drawText("Disclaimer:", {
        x: left,
        y,
        size: 10,
        font: boldFont,
        color: rgb(0.7, 0.2, 0.2),
      });
      y -= lineHeight * 0.8;

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
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.href = url;
    link.download = `${(report.pdf_data.athlete_name || "Athlete").replace(
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
    throw new Error(
      `Failed to generate PDF report: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
