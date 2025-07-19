import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

interface HorizontalBarChartProps {
  data: Array<{ name: string; value: number }>;
  title: string;
  xLabel: string;
  yLabel: string;
}

export default function HorizontalBarChart({
  data,
  title,
  xLabel,
  yLabel,
}: HorizontalBarChartProps) {
  const categories = data.map((item) => item.name);
  const seriesData = data.map((item) => item.value);

  const options: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      toolbar: {
        show: true,
      },
    },
    plotOptions: {
      bar: {
        horizontal: true,
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
          fontSize: "14px",
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
          fontSize: "14px",
          fontWeight: 400,
        },
      },
    },
    grid: {
      yaxis: {
        lines: {
          show: false,
        },
      },
      xaxis: {
        lines: {
          show: true,
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
      <div id="chartOne" className="w-full">
        <Chart options={options} series={series} type="bar" height={400} />
      </div>
    </div>
  );
}
