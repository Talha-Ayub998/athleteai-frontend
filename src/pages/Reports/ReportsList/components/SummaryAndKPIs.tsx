import React, { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import SectionWrapper from "../../Report/components/SectionWrapper";
import axiosInstance from "../../../../api/axiosInstance";

interface KPIData {
  user_id: number;
  user_email: string;
  matches_total: number;
  wins: number;
  losses: number;
  detail?: string;
  kpis: {
    win_rate_pct: string;
    offensive_submission_success_pct: string;
    defensive_submission_success_pct: string;
    top_moves: {
      top_offensive_move: string;
      top_defensive_threat: string;
    };
  };
  chart: {
    offense_threats_bar: {
      labels: string[];
      counts: number[];
      total_threats: number;
    };
    win_method_distribution: {
      labels: string[];
      counts: number[];
      percents: number[];
      total_wins: number;
    };
  };
  badges?: string[];
}

interface SummaryAndKPIsProps {
  userId: number;
}

const LoadingReports = () => {
  return (
    <div className="flex items-center justify-center py-12 flex-col">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="mt-3 text-gray-600 dark:text-gray-400">
        Loading reports...
      </span>
    </div>
  );
};

const SummaryAndKPIs: React.FC<SummaryAndKPIsProps> = ({ userId }) => {
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchKPIData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axiosInstance.get<KPIData>("/reports/kpis/", {
          params: {
            user_id: userId,
          },
        });

        setKpiData(response.data);
      } catch (err) {
        console.error("Error fetching KPI data:", err);
        setError("Failed to load KPI data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchKPIData();
    }
  }, [userId]);

  if (kpiData?.detail) {
    return (
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 sm:p-6">
        <div className="flex items-center justify-center py-12 flex-col">
          <p className="text-gray-600 dark:text-gray-400">No data available</p>
        </div>
      </div>
    );
  }

  // Horizontal Bar Chart configuration for offense threats
  const horizontalBarOptions: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar" as const,
      toolbar: {
        show: false,
      },
      parentHeightOffset: 0, // removes bottom padding
    },

    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 2,
        borderRadiusApplication: "end",
        barHeight: "70%",
      },
    },
    dataLabels: {
      enabled: true,
      style: {
        colors: ["#fff"],
        fontSize: "10px",
      },
    },
    stroke: {
      show: true,
      width: 1,
      colors: ["transparent"],
    },
    xaxis: {
      categories: kpiData?.chart?.offense_threats_bar?.labels || [],
      // title: {
      //   text: "Number of Attempts",
      // },
    },
    yaxis: {
      // title: {
      //   text: "Submission Types",
      // },
    },
    grid: {
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
      y: {
        formatter: (val) => `${val} attempts`,
      },
    },
  };

  const horizontalBarSeries = kpiData
    ? [
        {
          name: "Attempts",
          data: kpiData?.chart?.offense_threats_bar?.counts || [],
        },
      ]
    : [];

  // Pie Chart configuration for win method distribution
  const pieChartOptions: ApexOptions = {
    colors: ["#FFA500", "#FF6347", "#E91E63"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "pie" as const,
      height: 250,
      toolbar: {
        show: false,
      },
    },
    labels: kpiData?.chart?.win_method_distribution?.labels || [],
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
      style: {
        colors: ["#ffffff"],
        fontSize: "10px",
      },
      dropShadow: {
        enabled: false,
      },
    },
    legend: {
      show: true,
      position: "bottom",
      fontSize: "14px",
    },
    stroke: {
      show: false,
      width: 1,
    },
    tooltip: {
      y: {
        formatter: (val, { seriesIndex }) => {
          const counts = kpiData?.chart?.win_method_distribution?.counts || [];
          return `${counts[seriesIndex]} wins (${val.toFixed(1)}%)`;
        },
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            height: 300,
          },
          legend: {
            position: "bottom",
          },
        },
      },
    ],
  };

  const pieChartSeries =
    kpiData?.chart?.win_method_distribution?.percents || [];

  // Calculate summary statistics from API data (removed Avg Points)
  const summaryCards = kpiData
    ? [
        {
          title: "Total Matches",
          value: kpiData?.matches_total,
          color: "text-gray-900 dark:text-white",
        },
        {
          title: "Win Rate",
          value: kpiData?.kpis?.win_rate_pct,
          color: "text-green-600 dark:text-green-400",
        },
        {
          title: "Wins",
          value: kpiData?.wins,
          color: "text-blue-600 dark:text-blue-400",
        },
        {
          title: "Losses",
          value: kpiData?.losses,
          color: "text-red-600 dark:text-red-400",
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 sm:p-6">
        <LoadingReports />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 sm:p-6">
        <div className="flex items-center justify-center py-12 flex-col">
          <div className="text-center">
            <p className="text-lg font-medium">Error Loading Data</p>
            <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-gray-100 dark:border-gray-800 sm:p-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryCards.map((card, index) => (
          <div
            key={index}
            className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] text-gray-dark dark:text-gray-200 p-4"
          >
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className={`text-3xl font-bold ${card.color}`}>
                  {card.value}
                </p>
                <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
                  {card.title}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left side - Horizontal Bar Chart for Offense Threats */}
        <SectionWrapper>
          <div className="w-full">
            <h3 className="text-lg font-semibold  mb-4 text-gray-900 dark:text-white">
              Submission Frequencies
            </h3>
            <Chart
              options={horizontalBarOptions}
              series={horizontalBarSeries}
              type="bar"
              height={250}
            />
          </div>
        </SectionWrapper>

        {/* Right side - Pie Chart for Win Method Distribution */}
        <SectionWrapper>
          <div className="w-full ">
            <h3 className="text-lg font-semibold mb-4  text-gray-900 dark:text-white">
              Win Method Distribution
            </h3>
            <Chart
              options={pieChartOptions}
              series={pieChartSeries}
              type="pie"
              height={250}
            />
          </div>
        </SectionWrapper>
      </div>

      {/* Additional KPI Information */}
      {kpiData.kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              Offensive Success
            </h4>
            <span className="text-sm text-gray-900 dark:text-white">
              (based on submission)
            </span>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 pt-2">
              {kpiData.kpis.offensive_submission_success_pct}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              Defensive Success
            </h4>
            <span className="text-sm text-gray-900 dark:text-white">
              (based on submission)
            </span>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 pt-2">
              {kpiData.kpis.defensive_submission_success_pct}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              Top Offensive Move
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {kpiData.kpis.top_moves.top_offensive_move}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              Top Defensive Threat
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {kpiData.kpis.top_moves.top_defensive_threat}
            </p>
          </div>
        </div>
      )}

      {/* Badges Section */}
      {kpiData.badges && kpiData.badges.length > 0 && (
        <div className="mt-6">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
            Achievements
          </h4>
          <div className="flex flex-wrap gap-2">
            {kpiData.badges.map((badge, index) => (
              <span
                key={index}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full font-medium"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryAndKPIs;
