import BarChartOne from "../../../../components/charts/bar/BarChartOne";

const OffensiveAttemptsSection = ({ data, takeaway }) => (
  <div className="mb-8">
    <h2 className="text-xl font-bold text-brand-500 dark:text-brand-400 mb-2">
      Offensive Attempts
    </h2>
    <BarChartOne
      data={data}
      title="Top Offensive Attempts"
      xLabel="Move Name"
      yLabel="Number of Offense Attempts"
    />
    <div className="mt-4">
      <h3 className="font-bold text-brand-500 dark:text-brand-400">
        Key Takeaway
      </h3>
      <p>{takeaway}</p>
    </div>
  </div>
);

export default OffensiveAttemptsSection;
