import BarChartOne from "../../../../components/charts/bar/BarChartOne";

const DefensiveMoveAnalysisSection = ({ data, takeaway }) => (
  <div>
    <h2 className="text-xl font-bold text-brand-500 dark:text-brand-400 mb-2">
      Defensive Move Analysis
    </h2>
    <BarChartOne
      data={data}
      title="Top Defensive Successes"
      xLabel="Move Name"
      yLabel="Number of Successful Defense Attempts"
    />
    <div className="mt-4">
      <h3 className="font-bold text-brand-500 dark:text-brand-400">
        Key Takeaway
      </h3>
      <p>{takeaway}</p>
    </div>
  </div>
);

export default DefensiveMoveAnalysisSection;
