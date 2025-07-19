import Heading from "./components/Heading";
import HorizontalBarChartSection from "./components/HorizontalBarChartSection";
import VerticalBarChartSection from "./components/VerticalBarChartSection";
import FinalAnalysisSection from "./components/FinalAnalysisSection";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import SectionWrapper from "./components/SectionWrapper";
import { useParams } from "react-router-dom";
import { useContext, useEffect } from "react";
import { ReportsContext } from "../../../context/ReportsContext";
import ReportNotFound from "./components/ReportNotFound";
import ListSection from "./components/ListSection";
import LoadingReports from "../ReportsList/components/LoadingReports";

// Type definitions for component props
interface HeadingProps {
  athleteName: string;
  reportDate: string;
}

interface MoveData {
  name: string;
  value: number;
}

interface FinalAnalysisProps {
  text: string;
  disclaimer?: string;
}

interface ListSectionProps {
  list: {
    title: string;
    data: string[];
  };
}

interface ChartSectionProps {
  data: MoveData[];
  takeaway: string;
  sectionTitle: string;
  chartTitle: string;
  valuesTitle: string;
}

// Union type for all possible props
type SectionProps =
  | HeadingProps
  | FinalAnalysisProps
  | ListSectionProps
  | ChartSectionProps;

// Section type definition
interface Section {
  Component: React.ComponentType<SectionProps>;
  props: SectionProps;
}

const Report = () => {
  const param = useParams();

  const reportId = param.reportId;

  console.log("reportId", reportId);

  // @ts-expect-error: Context is untyped for now
  const { reports, fetchReports, loading } = useContext(ReportsContext);

  // Fetch reports if not already loaded
  useEffect(() => {
    if (!reports) {
      fetchReports(true);
    }
  }, [reports, fetchReports]);

  // Find the report by reportId
  const report = Array.isArray(reports)
    ? reports.find((r) => String(r.id) === String(reportId))
    : null;

  console.log("report", report);

  // Show loading while fetching reports
  if (loading) {
    return <LoadingReports />;
  }

  // Show ReportNotFound if reports are loaded but report is not found
  if (reports && !report) {
    return <ReportNotFound />;
  }

  // Show loading while waiting for reports
  if (!reports) {
    return <LoadingReports />;
  }

  const sections: Section[] = [
    {
      Component: Heading as React.ComponentType<SectionProps>,
      props: {
        athleteName: report.pdf_data.athlete_name,
        reportDate: report.uploaded_at,
      },
    },
    {
      Component: ListSection as React.ComponentType<SectionProps>,
      props: {
        list: {
          title: "Submissions",
          data: report.pdf_data.submissions,
        },
      },
    },
    {
      Component: ListSection as React.ComponentType<SectionProps>,
      props: {
        list: {
          title: "Match Types",
          data: report.pdf_data.match_types,
        },
      },
    },
    {
      Component: ListSection as React.ComponentType<SectionProps>,
      props: {
        list: {
          title: "Win/Loss Ratio",
          data: report.pdf_data["win/loss_ratio"],
        },
      },
    },
    {
      Component: ListSection as React.ComponentType<SectionProps>,
      props: {
        list: {
          title: "Points",
          data: report.pdf_data.points,
        },
      },
    },
    {
      Component: HorizontalBarChartSection as React.ComponentType<SectionProps>,
      props: {
        data: report.pdf_data.graph_data.offense_successes.labels.map(
          (label, index) => ({
            name: label,
            value: report.pdf_data.graph_data.offense_successes.values[index],
          })
        ),
        takeaway: report.pdf_data.offensive_analysis.successful,
        sectionTitle: "Offensive Move Analysis",
        chartTitle: "Offensive Move",
        valuesTitle: "Number of Successful Offense Attempts",
      },
    },
    {
      Component: VerticalBarChartSection as React.ComponentType<SectionProps>,
      props: {
        data: report.pdf_data.graph_data.offense_attempts.labels.map(
          (label, index) => ({
            name: label,
            value: report.pdf_data.graph_data.offense_attempts.values[index],
          })
        ),
        takeaway: report.pdf_data.offensive_analysis.attempted,
        sectionTitle: "Offensive Attempts",
        chartTitle: "Offensive Attempt",
        valuesTitle: "Number of Offense Attempts",
      },
    },
    {
      Component: HorizontalBarChartSection as React.ComponentType<SectionProps>,
      props: {
        data: report.pdf_data.graph_data.defense_successes.labels.map(
          (label, index) => ({
            name: label,
            value: report.pdf_data.graph_data.defense_successes.values[index],
          })
        ),
        takeaway: report.pdf_data.defensive_analysis.successful,
        sectionTitle: "Defensive Move Analysis",
        chartTitle: "Defensive Move",
        valuesTitle: "Number of Successful Defence Attempts",
      },
    },
    {
      Component: VerticalBarChartSection as React.ComponentType<SectionProps>,
      props: {
        data: report.pdf_data.graph_data.defense_attempts.labels.map(
          (label, index) => ({
            name: label,
            value: report.pdf_data.graph_data.defense_attempts.values[index],
          })
        ),
        takeaway: report.pdf_data.defensive_analysis.attempted,
        sectionTitle: "Defensive Attempts",
        chartTitle: "Defensive Attempt",
        valuesTitle: "Number of Defence Attempts",
      },
    },
    {
      Component: FinalAnalysisSection as React.ComponentType<SectionProps>,
      props: {
        text: report.pdf_data.final_summary.text,
        disclaimer: report.pdf_data.final_summary.disclaimer,
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageBreadcrumb
        pageTitle="Athlete's Report"
        path={["Reports", report.pdf_data.athlete_name]}
      />

      {sections.map(({ Component, props }, idx) => (
        <SectionWrapper key={idx}>
          <Component {...props} />
        </SectionWrapper>
      ))}
    </div>
  );
};

export default Report;
