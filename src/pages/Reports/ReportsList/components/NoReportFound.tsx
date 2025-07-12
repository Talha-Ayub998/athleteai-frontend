import { File } from "lucide-react";
import React from "react";

const NoReportFound = () => {
  return (
    <div className="text-center py-12">
      <File className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-600 dark:text-gray-400 text-lg">
        No reports found
      </p>
      <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
        Upload some files to get started
      </p>
    </div>
  );
};

export default NoReportFound;
