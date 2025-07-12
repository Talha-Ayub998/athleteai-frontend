// src/pages/Reports/Report/components/PointsSection.tsx
const PointsSection = ({ points }) => (
  <div>
    <h2 className="text-xl font-bold text-brand-500 dark:text-brand-400 mb-2">
      Points
    </h2>
    <ul className="list-disc ml-6">
      {points.map((pt, i) => (
        <li key={i}>{pt}</li>
      ))}
    </ul>
  </div>
);

export default PointsSection;
