const MatchTypesSection = ({ types }) => (
  <div>
    <h2 className="text-xl font-bold text-brand-500 dark:text-brand-400 mb-2">
      Match Types
    </h2>
    <ul className="list-disc ml-6">
      {types.map((type, i) => (
        <li key={i}>{type}</li>
      ))}
    </ul>
  </div>
);

export default MatchTypesSection;
