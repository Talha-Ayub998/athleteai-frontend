import React from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import SectionWrapper from "../../Report/components/SectionWrapper";

const SummaryAndKPIs = ({ reports, selectedItems }) => {
  // Get last 5 months for the chart
  const getLastFiveMonths = () => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const currentMonth = new Date().getMonth();
    const lastFiveMonths = [];

    for (let i = 4; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      lastFiveMonths.push(months[monthIndex]);
    }

    return lastFiveMonths;
  };

  // Chart configuration with proper typing
  const chartOptions: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar" as const,
      height: 200,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "50%",
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
      categories: getLastFiveMonths(),
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    legend: {
      show: false,
    },
    yaxis: {
      title: {
        text: undefined,
      },
    },
    grid: {
      yaxis: {
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
        show: false,
      },
      y: {
        formatter: (val) => `${val} reports`,
      },
    },
  };

  const chartSeries = [
    {
      name: "Reports",
      data: [45, 52, 38, 61, 42], // Sample data for last 5 months
    },
  ];

  // Calculate summary statistics
  const totalSize =
    reports?.reduce((total, report) => total + (report.file_size_mb || 0), 0) ||
    0;
  const avgSize =
    reports?.length > 0 ? (totalSize / reports.length).toFixed(2) : "0";

  // Sample KPI data - you can replace with actual calculations
  const kpiData = [
    {
      title: "Total Files",
      value: reports?.length || 0,
      color: "text-gray-900 dark:text-white",
    },
    {
      title: "Selected",
      value: selectedItems?.size || 0,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Total Size",
      value: `${totalSize.toFixed(2)} MB`,
      color: "text-green-600 dark:text-green-400",
    },
    {
      title: "Avg Size",
      value: `${avgSize} MB`,
      color: "text-purple-600 dark:text-purple-400",
    },
  ];

  return (
    <div className="p-4 border-t border-gray-100 dark:border-gray-800 sm:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left side - Bar Chart */}
        <SectionWrapper>
          <div className="w-full">
            <Chart
              options={chartOptions}
              series={chartSeries}
              type="bar"
              height={250}
            />
          </div>
        </SectionWrapper>

        {/* Right side - Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          {kpiData.map((kpi, index) => (
            <div
              key={index}
              className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] text-gray-dark dark:text-gray-200"
            >
              <div className="flex items-center justify-center h-full ">
                <div className="text-center ">
                  <p className={`text-3xl font-bold ${kpi.color}`}>
                    {kpi.value}
                  </p>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
                    {kpi.title}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SummaryAndKPIs;
