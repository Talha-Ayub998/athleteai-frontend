import React from "react";

const UploadStatistics = ({ files }) => {
  return (
    <div>
      {files.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {files.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Total Files
              </p>
            </div>
            <div>
              <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {files.filter((f) => f.status === "pending").length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Pending
              </p>
            </div>
            <div>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                {files.filter((f) => f.status === "completed").length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Completed
              </p>
            </div>
            <div>
              <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                {files.filter((f) => f.status === "error").length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Failed</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadStatistics;
