import Heading from "./components/Heading";
import DefensiveAttemptsSection from "./components/DefensiveAttemptsSection";
import OffensiveAttemptsSection from "./components/OffensiveAttemptsSection";
import SubmissionsSection from "./components/SubmissionsSection";
import MatchTypesSection from "./components/MatchTypesSection";
import WinLossRatioSection from "./components/WinLossRatioSection";
import PointsSection from "./components/PointsSection";
import DefensiveMoveAnalysisSection from "./components/DefensiveMoveAnalysisSection";
import OffensiveMoveAnalysisSection from "./components/OffensiveMoveAnalysisSection";
import FinalAnalysisSection from "./components/FinalAnalysisSection";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import SectionWrapper from "./components/SectionWrapper";

// Type definitions for component props
interface HeadingProps {
  athleteName: string;
  reportDate: string;
}

interface MoveData {
  name: string;
  value: number;
}

interface SubmissionsData {
  wins: string[];
  threats: string[];
  defensiveThreats: string[];
  offensiveMovePercentage: string;
  defensiveMovePercentage: string;
  offensiveSuccessRatio: string;
  defensiveSuccessRatio: string;
}

interface AttemptsProps {
  data: MoveData[];
  takeaway: string;
}

interface AnalysisProps {
  data: MoveData[];
  takeaway: string;
}

interface SubmissionsProps {
  data: SubmissionsData;
}

interface MatchTypesProps {
  types: string[];
}

interface WinLossRatioProps {
  data: string[];
}

interface PointsProps {
  points: string[];
}

interface FinalAnalysisProps {
  text: string;
}

// Union type for all possible props
type SectionProps =
  | HeadingProps
  | SubmissionsProps
  | MatchTypesProps
  | WinLossRatioProps
  | PointsProps
  | AttemptsProps
  | AnalysisProps
  | FinalAnalysisProps;

// Section type definition
interface Section {
  Component: React.ComponentType<SectionProps>;
  props: SectionProps;
}

const defensiveAttemptsData: MoveData[] = [
  { name: "Guard Pass", value: 8 },
  { name: "Single Leg", value: 7 },
  { name: "Double Leg", value: 5 },
  { name: "Half Guard", value: 3 },
  { name: "Guard Pull", value: 2 },
  { name: "Body Lock", value: 1 },
  { name: "Heel Hook", value: 1 },
];
const defensiveAttemptsTakeaway =
  "The Guard Pass from Passing was the most attempted move by the opposition, with 8 attempts accounting for 25.81% of all moves, while Heel Hook being the most attempted submission move by opposition x1.";

const offensiveAttemptsData: MoveData[] = [
  { name: "Closed Guard", value: 5 },
  { name: "Guard Pass", value: 4 },
  { name: "Guard Pull", value: 4 },
  { name: "Choi Bar", value: 2 },
  { name: "Double Leg", value: 2 },
  { name: "Trip", value: 2 },
  { name: "Sweep", value: 2 },
];
const offensiveAttemptsTakeaway =
  "Closed Guard attempts from Neutral Position was attempted the most out of any position with 5 attempts (15.62%) with Choi Bar being the most attempted submission x2.";

const submissionsData: SubmissionsData = {
  wins: ["4 Wins – Arm Bar x1, Mir Lock x1, Choi Bar x1, Knee Bar x1"],
  threats: [
    "10 Offensive Threats – Straight Ankle Lock x1, Arm Bar x1, Mir Lock x1, Heel Hook x1, Choi Bar x2, Kimura x1, Knee Bar x1, Straight Arm Lock x1, Triangle x1",
  ],
  defensiveThreats: ["2 Defensive Threats – Leg Lock Attack x1, Heel Hook x1"],
  offensiveMovePercentage: "31.25%",
  defensiveMovePercentage: "6.45%",
  offensiveSuccessRatio: "40.00%",
  defensiveSuccessRatio: "100.00%",
};

const matchTypes: string[] = ["5 No-GI Points", "1 No-GI Sub Only"];

const winLossRatio: string[] = [
  "6 matches",
  "6 Wins (2x Referee Decision)",
  "0 Losses",
  "100% Win Ratio",
];

const points: string[] = [
  "Match-1 - 0 – 0 Points",
  "Match-2 - 0 – 0 Points",
  "Match-3 - 0 – 0 Points",
  "Match-4 - 9 – 0 Points",
  "Match-5 - 0 – 0 Points",
  "Match 6 - Not Applicable",
];

const defensiveMoveAnalysisData: MoveData[] = [
  { name: "Single Leg", value: 7 },
  { name: "Guard Pass", value: 7 },
  { name: "Double Leg", value: 5 },
  { name: "Half Guard", value: 3 },
  { name: "Leg Lock Attack", value: 1 },
  { name: "Knee Cut", value: 1 },
  { name: "Heel Hook", value: 1 },
];
const defensiveMoveAnalysisTakeaway =
  "With successful defensive attempts against moves such as Body Lock, Double Leg and Single Leg, Takedown Category accounts for 50.00% of the success in defensive maneuvers.";

const offensiveMoveAnalysisData: MoveData[] = [
  { name: "Closed Guard", value: 5 },
  { name: "Guard Pull", value: 4 },
  { name: "Guard Pass", value: 3 },
  { name: "Trip", value: 2 },
  { name: "Reverse De La Riva", value: 1 },
  { name: "Mir Lock", value: 1 },
  { name: "Knee Bar", value: 1 },
];
const offensiveMoveAnalysisTakeaway =
  "With moves such as Guard Pull and Trip, Takedown Category accounts for 31.58% of the success in offensive maneuvers.";

const finalAnalysisText = `Adele Fornarino demonstrated a strategic use of guard manipulation and frequent guard pull techniques across multiple matches, achieving notable success in this aspect. Their consistent ability to execute guard pulls highlights a strong suit in dictating the pace and positioning of the matches. Additionally, their effective use of the Reverse De La Riva and several defensive maneuvers, such as in fending off multiple leg attack attempts and utilizing single leg defenses, underscores their defensive capabilities. The several attempts at submissions, including Straight Ankle Locks and Choi Bars, despite not always succeeding, indicate a proactive approach to seeking finishes. It is particularly noteworthy that Adele secured victories in all their matches, showcasing not just their tactical acumen but also their ability to control and dominate without any match losses. This comprehensive performance suggests a well-rounded skill set, but continuing to refine the submission attempts could further enhance their competitive edge in future competitions.`;

const sections: Section[] = [
  {
    Component: Heading as React.ComponentType<SectionProps>,
    props: { athleteName: "Adele Fornarino", reportDate: "September 09, 2024" },
  },
  {
    Component: SubmissionsSection as React.ComponentType<SectionProps>,
    props: { data: submissionsData },
  },
  {
    Component: MatchTypesSection as React.ComponentType<SectionProps>,
    props: { types: matchTypes },
  },
  {
    Component: WinLossRatioSection as React.ComponentType<SectionProps>,
    props: { data: winLossRatio },
  },
  {
    Component: PointsSection as React.ComponentType<SectionProps>,
    props: { points },
  },
  {
    Component:
      OffensiveMoveAnalysisSection as React.ComponentType<SectionProps>,
    props: {
      data: offensiveMoveAnalysisData,
      takeaway: offensiveMoveAnalysisTakeaway,
    },
  },
  {
    Component: OffensiveAttemptsSection as React.ComponentType<SectionProps>,
    props: { data: offensiveAttemptsData, takeaway: offensiveAttemptsTakeaway },
  },
  {
    Component:
      DefensiveMoveAnalysisSection as React.ComponentType<SectionProps>,
    props: {
      data: defensiveMoveAnalysisData,
      takeaway: defensiveMoveAnalysisTakeaway,
    },
  },
  {
    Component: DefensiveAttemptsSection as React.ComponentType<SectionProps>,
    props: { data: defensiveAttemptsData, takeaway: defensiveAttemptsTakeaway },
  },
  {
    Component: FinalAnalysisSection as React.ComponentType<SectionProps>,
    props: { text: finalAnalysisText },
  },
];

const Report = () => (
  <div className="space-y-6">
    <PageBreadcrumb
      pageTitle="Athlete's Report"
      path={["Reports", "Adele_Fornarino's_Jiu_Jitsu_Report.pdf"]}
    />
    {sections.map(({ Component, props }, idx) => (
      <SectionWrapper key={idx}>
        <Component {...props} />
      </SectionWrapper>
    ))}
  </div>
);

export default Report;
