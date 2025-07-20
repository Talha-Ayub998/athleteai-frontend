import HorizontalBarChart from "./HorizontalBarChart";

const HorizontalBarChartSection = ({
  data,
  takeaway,
  sectionTitle,
  chartTitle,
  valuesTitle,
  chartId,
}) => (
  <div>
    <h2 className="text-xl font-bold text-brand-500 dark:text-brand-400 mb-2">
      {sectionTitle}
    </h2>
    <HorizontalBarChart
      data={data}
      title={chartTitle}
      xLabel={valuesTitle}
      yLabel="Move Name"
      chartId={chartId}
    />
    <div className="mt-4">
      <h3 className="font-bold text-brand-500 dark:text-brand-400">
        Key Takeaway
      </h3>
      <p>{takeaway}</p>
    </div>
  </div>
);

export default HorizontalBarChartSection;
