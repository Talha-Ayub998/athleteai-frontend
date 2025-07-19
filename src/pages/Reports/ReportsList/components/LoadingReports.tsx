import React from "react";

const LoadingReports = () => {
  return (
    <div className="flex items-center justify-center py-12 flex-col">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="mt-3 text-gray-600 dark:text-gray-400">
        Loading reports...
      </span>
    </div>
  );
};

export default LoadingReports;
