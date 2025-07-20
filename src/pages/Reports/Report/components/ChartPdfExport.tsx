import React, { useState } from "react";
import Chart from "react-apexcharts";
import ApexCharts from "apexcharts";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
(window as any).ApexCharts = ApexCharts;

const ChartPdfExport: React.FC = () => {
  // We'll use a querySelector to get the chart DOM node for export
  const [isChartReady, setIsChartReady] = useState(false);

  const chartOptions = {
    chart: {
      id: "sales-chart",
      events: {
        mounted: () => setIsChartReady(true),
      },
    },
    xaxis: {
      categories: ["Jan", "Feb", "Mar", "Apr", "May"],
    },
  };

  const chartSeries = [
    {
      name: "Sales",
      data: [30, 40, 35, 50, 49],
    },
  ];

  const exportPDF = async () => {
    if (!isChartReady) {
      alert("Chart is not ready yet. Please try again in a moment.");
      return;
    }

    try {
      // Get the chart instance by id
      // @ts-expect-error: ApexCharts is a global injected by the ApexCharts script, not typed in TS
      const ApexCharts = window.ApexCharts;
      if (!ApexCharts) throw new Error("ApexCharts is not available on window");
      const dataURI = await ApexCharts.exec("sales-chart", "dataURI");
      const base64 = dataURI.imgURI.split(",")[1];
      const imageBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]); // A4 size
      const pngImage = await pdfDoc.embedPng(imageBytes);
      const imgDims = pngImage.scale(0.5);
      // Title
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      page.drawText("Monthly Sales Report", {
        x: 50,
        y: 800,
        size: 24,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
      // Date
      page.drawText(`Generated on: ${new Date().toLocaleDateString()}`, {
        x: 50,
        y: 780,
        size: 12,
        color: rgb(0.3, 0.3, 0.3),
      });
      // Chart image
      page.drawImage(pngImage, {
        x: 50,
        y: 500,
        width: imgDims.width,
        height: imgDims.height,
      });
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "sales-report.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Something went wrong while generating the PDF.");
    }
  };

  return (
    <div>
      <Chart
        options={chartOptions}
        series={chartSeries}
        type="bar"
        height={350}
      />
      <button onClick={exportPDF} style={{ marginTop: 16 }}>
        Download PDF
      </button>
    </div>
  );
};
export default ChartPdfExport;
