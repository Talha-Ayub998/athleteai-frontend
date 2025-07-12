import BarChartOne from "../../../../components/charts/bar/BarChartOne";

const OffensiveMoveAnalysisSection = ({ data, takeaway }) => (
  <div>
    <h2 className="text-xl font-bold text-brand-500 dark:text-brand-400 mb-2">
      Offensive Move Analysis
    </h2>
    <BarChartOne
      data={data}
      title="Top Offensive Successes"
      xLabel="Move Name"
      yLabel="Number of Successful Offense Attempts"
    />
    <div className="mt-4">
      <h3 className="font-bold text-brand-500 dark:text-brand-400">
        Key Takeaway
      </h3>
      <p>{takeaway}</p>
    </div>
  </div>
);

export default OffensiveMoveAnalysisSection;
