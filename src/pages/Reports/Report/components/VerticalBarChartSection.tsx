import VerticalBarChart from "./VerticalBarChart";

const VerticalBarChartSection = ({
  data,
  takeaway,
  sectionTitle,
  chartTitle,
  valuesTitle,
}) => (
  <div>
    <h2 className="text-xl font-bold text-brand-500 dark:text-brand-400 mb-2">
      {sectionTitle}
    </h2>
    <VerticalBarChart
      data={data}
      title={chartTitle}
      xLabel="Move Name"
      yLabel={valuesTitle}
    />
    <div className="mt-4">
      <h3 className="font-bold text-brand-500 dark:text-brand-400">
        Key Takeaway
      </h3>
      <p>{takeaway}</p>
    </div>
  </div>
);

export default VerticalBarChartSection;
