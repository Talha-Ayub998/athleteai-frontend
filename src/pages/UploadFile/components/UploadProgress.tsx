import React from "react";
import { getStatusColor } from "../../../utils/files/getStatusColor";
import { Loader2 } from "lucide-react";
import { getStatusText } from "../../../utils/files/getStatusText";

const UploadProgress = ({ file, uploadProgress }) => {
  // Safely get the progress value, default to 0 if not found
  const progressValue =
    uploadProgress && uploadProgress[file.id] ? uploadProgress[file.id] : 0;

  return (
    <div className="flex-shrink-0 mr-3 w-24">
      {/* <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getStatusColor(
            file.status
          )}`}
          style={{
            width:
              file.status === "uploading"
                ? `${progressValue}%`
                : file.status === "completed"
                ? "100%"
                : "0%",
          }}
        ></div>
      </div> */}
      <div className="flex items-center mt-1">
        {file.status === "uploading" && (
          <Loader2 className="w-3 h-3 animate-spin text-blue-500 mr-1" />
        )}
        <p
          className={`text-xs text-center w-full ${
            file.status === "completed"
              ? "text-green-600 dark:text-green-400"
              : file.status === "error"
              ? "text-red-600 dark:text-red-400"
              : file.status === "uploading"
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {getStatusText(file.status)}
        </p>
      </div>
    </div>
  );
};

export default UploadProgress;
