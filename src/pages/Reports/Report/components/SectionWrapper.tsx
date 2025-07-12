const SectionWrapper = ({ children }) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] text-gray-dark dark:text-gray-200 ">
      <div className="mx-8 py-8 ">{children}</div>
    </div>
  );
};

export default SectionWrapper;
