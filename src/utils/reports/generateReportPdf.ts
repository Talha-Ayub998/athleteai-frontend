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

// Helper to render chart in hidden container at fixed size
async function renderChartForPDF(
  chartConfig: any,
  width: number = 700,
  height: number = 450
): Promise<string> {
  // Create hidden container
  const container = document.createElement("div");
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "-9999px";
  document.body.appendChild(container);

  try {
    // Render chart in hidden container
    const chart = new ApexCharts(container, {
      ...chartConfig,
      chart: {
        ...chartConfig.chart,
        width,
        height,
        animations: { enabled: false }, // Disable animations for faster rendering
      },
    });

    await chart.render();

    // Wait for chart to fully render
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Export as data URI
    const result = await chart.dataURI();
    const dataUri = result.imgURI;

    // Cleanup
    chart.destroy();
    document.body.removeChild(container);

    return dataUri;
  } catch (error) {
    // Cleanup on error
    if (container.parentNode) {
      document.body.removeChild(container);
    }
    throw error;
  }
}

// Helper to create chart config from report data
function createChartConfig(
  labels: string[],
  values: number[],
  title: string,
  color: string,
  horizontal: boolean = false
): any {
  return {
    chart: {
      type: "bar",
      toolbar: { show: false },
      fontFamily: "Arial, Helvetica, sans-serif", // Change this to your preferred font
    },
    series: [
      {
        name: title,
        data: values,
      },
    ],
    xaxis: {
      categories: labels,
      title: {
        text: horizontal ? title : "Move Name",
        style: {
          fontSize: "14px",
          fontWeight: 500,
          fontFamily: "Arial, Helvetica, sans-serif", // X-axis title font
          color: "#374151",
        },
      },
      labels: {
        style: {
          fontSize: "12px",
          fontFamily: "Arial, Helvetica, sans-serif", // X-axis labels font
          colors: "#6B7280",
        },
      },
    },
    yaxis: {
      title: {
        text: horizontal ? "Move Name" : title,

        style: {
          fontSize: "14px",
          fontWeight: 500,
          fontFamily: "Arial, Helvetica, sans-serif", // Y-axis title font
          color: "#374151",
        },
      },
      labels: {
        style: {
          fontSize: "12px",
          fontFamily: "Arial, Helvetica, sans-serif", // Y-axis labels font
          colors: "#6B7280",
        },
      },
    },
    colors: [color],
    title: {
      text: "",
      align: "center",
    },
    plotOptions: {
      bar: {
        horizontal: horizontal,
        columnWidth: horizontal ? undefined : "55%",
        barHeight: horizontal ? "55%" : undefined,
        borderRadius: 4,
      },
    },
    dataLabels: {
      enabled: true,
    },
    grid: {
      borderColor: "#E5E7EB",
      strokeDashArray: 0,
      xaxis: {
        lines: {
          show: horizontal, // Show x-axis lines only in vertical charts
        },
      },
      yaxis: {
        lines: {
          show: !horizontal, // Show y-axis lines only in horizontal charts
        },
      },
    },
  };
}

export async function generateReportPdf(report: ReportType): Promise<void> {
  try {
    // Generate all charts at fixed size for PDF (independent of screen size)
    const [
      offenseSuccessImg,
      offenseAttemptsImg,
      defenseSuccessImg,
      defenseAttemptsImg,
    ] = await Promise.all([
      renderChartForPDF(
        createChartConfig(
          report.pdf_data.graph_data.offense_successes.labels,
          report.pdf_data.graph_data.offense_successes.values,
          "Number of Successful Offense Attempts",
          "#5470FE", // Blue color matching your screenshot
          true // horizontal
        )
      ),
      renderChartForPDF(
        createChartConfig(
          report.pdf_data.graph_data.offense_attempts.labels,
          report.pdf_data.graph_data.offense_attempts.values,
          "Number of Offense Attempts",
          "#5470FE", // Blue color matching your screenshot
          false // vertical
        )
      ),
      renderChartForPDF(
        createChartConfig(
          report.pdf_data.graph_data.defense_successes.labels,
          report.pdf_data.graph_data.defense_successes.values,
          "Number of Successful Defense Attempts",
          "#5470FE", // Blue color matching your screenshot
          true // horizontal
        )
      ),
      renderChartForPDF(
        createChartConfig(
          report.pdf_data.graph_data.defense_attempts.labels,
          report.pdf_data.graph_data.defense_attempts.values,
          "Number of Defense Attempts",
          "#5470FE", // Blue color matching your screenshot
          false // vertical
        )
      ),
    ]);
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595, 842]); // A4

    // Page margins and padding
    const topPadding = 60;
    const bottomPadding = 60;
    const leftPadding = 50;
    const rightPadding = 50;

    let y = 840 - topPadding;
    const left = leftPadding;
    const right = 595 - rightPadding;
    const lineHeight = 20;
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Helper function to check if new page is needed
    function checkNewPage(requiredSpace: number = 40): void {
      if (y < bottomPadding + requiredSpace) {
        page = pdfDoc.addPage([595, 842]);
        y = 842 - topPadding;
      }
    }

    // Add section title with more spacing
    function addSectionTitle(title: string): void {
      checkNewPage(80);
      y -= lineHeight * 0.5;
      page.drawText(title, {
        x: left,
        y,
        size: 14,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.6),
      });
      y -= lineHeight * 1.5;
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
          const xPos = isFirstLine ? left + 10 : left + 20;
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
      y -= lineHeight * 1.2;
    }

    // Add chart section with image and analysis
    async function addChartSection(
      title: string,
      img: string,
      analysis: string
    ): Promise<void> {
      // Start each chart section on a new page with padding
      page = pdfDoc.addPage([595, 842]);
      y = 842 - topPadding;

      addSectionTitle(title);

      try {
        const imageBytes = dataUriToBytes(img);
        const pngImage = await pdfDoc.embedPng(imageBytes);

        // Fixed width with maintained aspect ratio
        const fixedWidth = 450;
        const originalWidth = pngImage.width;
        const originalHeight = pngImage.height;
        const aspectRatio = originalHeight / originalWidth;

        // Calculate height based on aspect ratio to prevent stretching
        const imgHeight = fixedWidth * aspectRatio;

        checkNewPage(imgHeight + 80);

        // Center the chart horizontally
        // const xPosition = left + (right - left - fixedWidth) / 2;
        const xPosition = left + 10;

        page.drawImage(pngImage, {
          x: xPosition,
          y: y - imgHeight,
          width: fixedWidth,
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

        y -= lineHeight * 1.5;
      } catch (error) {
        console.error(`Error adding chart ${title}:`, error);
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

    // Charts Sections - Each on new pages
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
      y -= lineHeight * 1.0;

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
    const blob = new Blob([new Uint8Array(pdfBytes)], {
      type: "application/pdf",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.href = url;
    link.download = `${(report.pdf_data.athlete_name || "Athlete").replace(
      /\s+/g,
      "_"
    )}_Jiu_Jitsu_Report.pdf`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

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
