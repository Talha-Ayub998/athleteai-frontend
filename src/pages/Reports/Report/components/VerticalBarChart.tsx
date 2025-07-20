import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

interface VerticalBarChartProps {
  data: Array<{ name: string; value: number }>;
  title: string;
  xLabel: string;
  yLabel: string;
  chartId: string;
}

export default function VerticalBarChart({
  data,
  title,
  xLabel,
  yLabel,
  chartId,
}: VerticalBarChartProps) {
  const categories = data.map((item) => item.name);
  const seriesData = data.map((item) => item.value);

  const options: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      id: chartId,
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 180,
      toolbar: {
        show: true,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "80%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },
    xaxis: {
      categories: categories,
      title: {
        text: xLabel,
        style: {
          fontSize: "16px",
          fontWeight: 400,
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
    },
    yaxis: {
      title: {
        text: yLabel,
        style: {
          fontSize: "16px",
          fontWeight: 400,
        },
      },
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
      xaxis: {
        lines: {
          show: false,
        },
      },
    },
    fill: {
      opacity: 1,
    },

    tooltip: {
      x: {
        show: true,
      },
      y: {
        formatter: (val: number) => `${val}`,
      },
    },
  };
  const series = [
    {
      name: title,
      data: seriesData,
    },
  ];
  return (
    <div className="max-w-full overflow-x-auto custom-scrollbar">
      <div id="chartOne" className="min-w-[500px]">
        <Chart options={options} series={series} type="bar" height={400} />
      </div>
    </div>
  );
}
