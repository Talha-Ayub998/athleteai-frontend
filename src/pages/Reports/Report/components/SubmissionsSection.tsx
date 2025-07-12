const SubmissionsSection = ({ data }) => (
  <div>
    <h2 className="text-xl font-bold text-brand-500 dark:text-brand-400 mb-2">
      Submissions
    </h2>
    <ul className="list-disc ml-6 mb-2">
      {data.wins.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
      {data.threats.map((item, i) => (
        <li key={i + 100}>{item}</li>
      ))}
      {data.defensiveThreats.map((item, i) => (
        <li key={i + 200}>{item}</li>
      ))}
    </ul>
    <ul className="ml-6 mb-2">
      <li>
        Offensive Submission Move Percentage – {data.offensiveMovePercentage}
      </li>
      <li>
        Defensive Submission Move Percentage – {data.defensiveMovePercentage}
      </li>
      <li>Offensive Submission Success Ratio – {data.offensiveSuccessRatio}</li>
      <li>Defensive Submission Success Ratio – {data.defensiveSuccessRatio}</li>
    </ul>
  </div>
);

export default SubmissionsSection;
