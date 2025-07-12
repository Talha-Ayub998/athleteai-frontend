// src/pages/Reports/Report/components/WinLossRatioSection.tsx
const WinLossRatioSection = ({ data }) => (
  <div>
    <h2 className="text-xl font-bold text-brand-500 dark:text-brand-400 mb-2">
      Win/Loss Ratio
    </h2>
    <ul className="list-disc ml-6">
      {data.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  </div>
);

export default WinLossRatioSection;
