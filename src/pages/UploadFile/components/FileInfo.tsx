import React from "react";
import { formatFileSize } from "../../../utils/files/formatFileSize";

const FileInfo = ({ file }) => {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
        {file.name}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {formatFileSize(file.size)}
      </p>
    </div>
  );
};

export default FileInfo;
