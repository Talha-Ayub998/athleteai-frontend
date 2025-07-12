// src/pages/Reports/Report/components/DefensiveAttemptsSection.tsx

import BarChartOne from "../../../../components/charts/bar/BarChartOne";

const DefensiveAttemptsSection = ({ data, takeaway }) => (
  <div>
    <h2 className="text-xl font-bold text-brand-500 dark:text-brand-400 mb-2">
      Defensive Attempts
    </h2>
    <BarChartOne
      data={data}
      title="Top Defensive Attempts"
      xLabel="Move Name"
      yLabel="Number of Defense Attempts"
    />
    <div className="mt-4">
      <h3 className="font-bold text-brand-500 dark:text-brand-400">
        Key Takeaway
      </h3>
      <p>{takeaway}</p>
    </div>
  </div>
);

export default DefensiveAttemptsSection;
