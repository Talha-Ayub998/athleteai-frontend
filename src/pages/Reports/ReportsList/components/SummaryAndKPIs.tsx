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
  detail: string;
  kpis: {
    win_rate_pct: string;
    offensive_submission_success_pct: string;
    defensive_submission_success_pct: string;
    avg_points_per_match: number;
    top_moves: {
      top_offensive_move: string;
      top_defensive_threat: string;
    };
  };
  chart: {
    points_bar: {
      labels: string[];
      my_points: number[];
      opp_points: number[];
      partial_points: boolean;
    };
  };
  badges: string[];
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
      } catch (err: any) {
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

  // Chart configuration with proper typing
  const chartOptions: ApexOptions = {
    colors: ["#465fff", "#ff6b6b"],
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
      categories: kpiData?.chart?.points_bar?.labels.slice(0, 10) || [], // Show first 10 matches
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
    },
    yaxis: {
      title: {
        text: "Points",
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
        show: true,
      },
      y: {
        formatter: (val) => `${val} points`,
      },
    },
  };

  const chartSeries = kpiData
    ? [
        {
          name: "My Points",
          data: kpiData?.chart?.points_bar?.my_points.slice(0, 10), // Show first 10 matches
        },
        {
          name: "Opponent Points",
          data: kpiData?.chart?.points_bar?.opp_points.slice(0, 10), // Show first 10 matches
        },
      ]
    : [];

  // Calculate summary statistics from API data
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
          title: "Avg Points",
          value: kpiData?.kpis?.avg_points_per_match?.toFixed(1),
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
          <div className="text-red-500 text-center">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left side - Bar Chart */}
        <SectionWrapper>
          <div className="w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Points Per Match
            </h3>
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
      </div>

      {/* Additional KPI Information */}
      {kpiData.kpis && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              Offensive Success
            </h4>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {kpiData.kpis.offensive_submission_success_pct}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              Defensive Success
            </h4>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
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
