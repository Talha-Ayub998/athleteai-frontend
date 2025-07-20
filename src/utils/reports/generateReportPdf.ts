import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
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
  const lineHeight = 20;
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  function addSectionTitle(title: string) {
    page.drawText(title, {
      x: left,
      y,
      size: 14,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.6),
    });
    y -= lineHeight;
  }
  function addBullets(items: string[]) {
    for (const item of items) {
      page.drawText(`• ${item}`, { x: left + 10, y, size: 11, font });
      y -= lineHeight * 0.9;
      if (y < 80) {
        y = 800;
        page = pdfDoc.addPage([595, 842]);
      }
    }
    y -= lineHeight * 0.5;
  }
  function addNumbered(items: string[]) {
    items.forEach((item, idx) => {
      page.drawText(`${idx + 1}. ${item}`, { x: left + 10, y, size: 11, font });
      y -= lineHeight * 0.9;
      if (y < 80) {
        y = 800;
        page = pdfDoc.addPage([595, 842]);
      }
    });
    y -= lineHeight * 0.5;
  }
  async function addChartSection(title: string, img: string, caption: string) {
    addSectionTitle(title);
    const imageBytes = dataUriToBytes(img);
    const pngImage = await pdfDoc.embedPng(imageBytes);
    const imgDims = pngImage.scale(0.5);
    page.drawImage(pngImage, {
      x: left,
      y: y - imgDims.height,
      width: imgDims.width,
      height: imgDims.height,
    });
    y -= imgDims.height + 10;
    page.drawText(caption, {
      x: left,
      y,
      size: 11,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= lineHeight * 1.5;
    if (y < 80) {
      y = 800;
      page = pdfDoc.addPage([595, 842]);
    }
  }
  // --- Title & Info ---
  page.drawText(`Jiu-Jitsu Match Report`, {
    x: left,
    y,
    size: 22,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= lineHeight * 1.5;
  page.drawText(`Athlete: ${report.pdf_data.athlete_name}`, {
    x: left,
    y,
    size: 14,
    font: boldFont,
  });
  y -= lineHeight;
  page.drawText(
    `Report Date: ${report.pdf_data.report_date || report.uploaded_at}`,
    { x: left, y, size: 12, font }
  );
  y -= lineHeight;
  page.drawText(`Filename: ${report.filename}`, { x: left, y, size: 12, font });
  y -= lineHeight;
  page.drawText(`Uploaded by: ${report.uploaded_by}`, {
    x: left,
    y,
    size: 12,
    font,
  });
  y -= lineHeight * 1.5;
  // --- Submissions ---
  addSectionTitle("Submissions");
  addBullets(report.pdf_data.submissions);
  // --- Match Types ---
  addSectionTitle("Match Types");
  addBullets(report.pdf_data.match_types);
  // --- Win/Loss Ratio ---
  addSectionTitle("Win/Loss Ratio");
  addBullets(report.pdf_data["win/loss_ratio"]);
  // --- Points ---
  addSectionTitle("Points");
  addNumbered(report.pdf_data.points);
  // --- Charts Section ---
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
  // --- Key Takeaways ---
  addSectionTitle("Key Takeaways");
  const wrapText = (
    text: string,
    maxWidth: number,
    size: number,
    font: unknown
  ) => {
    const words = text.split(" ");
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      // @ts-expect-error: font is a pdf-lib font object
      if (font.widthOfTextAtSize(test, size) > maxWidth) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  };
  const summaryLines = wrapText(
    report.pdf_data.final_summary.text,
    495,
    11,
    font
  );
  for (const line of summaryLines) {
    page.drawText(line, { x: left, y, size: 11, font });
    y -= lineHeight * 0.9;
    if (y < 80) {
      y = 800;
      page = pdfDoc.addPage([595, 842]);
    }
  }
  if (report.pdf_data.final_summary.disclaimer) {
    const disclaimerLines = wrapText(
      report.pdf_data.final_summary.disclaimer,
      495,
      9,
      font
    );
    for (const line of disclaimerLines) {
      page.drawText(line, {
        x: left,
        y,
        size: 9,
        font,
        color: rgb(0.7, 0.2, 0.2),
      });
      y -= lineHeight * 0.8;
      if (y < 80) {
        y = 800;
        page = pdfDoc.addPage([595, 842]);
      }
    }
  }
  // --- Download PDF ---
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${report.pdf_data.athlete_name}_report.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
