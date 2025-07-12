import React from "react";
import { formatFileSize } from "../../../../utils/files/formatFileSize";

const Statistics = ({ reports, selectedItems }) => {
  return (
    <div className="p-4 border-t border-gray-100 dark:border-gray-800 sm:p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {reports.length}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total Files
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {selectedItems.size}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Selected</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {reports.reduce((total, report) => total + report.size_bytes, 0) > 0
              ? formatFileSize(
                  reports.reduce(
                    (total, report) => total + report.size_bytes,
                    0
                  )
                )
              : "0 Bytes"}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Size</p>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
