const FinalAnalysisSection = ({ text, disclaimer }) => (
  <div>
    <h2 className="text-xl font-bold text-brand-500 dark:text-brand-400 mb-2">
      Final Analysis & Recommendation
    </h2>
    <p>{text}</p>
    {disclaimer && (
      <p className="text-sm text-amber-500 dark:text-amber-300 mt-4 italic">
        {disclaimer}
      </p>
    )}
  </div>
);

export default FinalAnalysisSection;
