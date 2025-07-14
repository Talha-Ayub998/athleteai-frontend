import { Upload } from "lucide-react";
import React from "react";

const UploadFilesArea = ({
  isDragOver,
  handleDrop,
  handleDragOver,
  handleDragLeave,
  fileInputRef,
  handleInputChange,
  disabled,
}) => {
  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
        disabled
          ? "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed"
          : isDragOver
          ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
          : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
      }`}
      onDrop={disabled ? undefined : handleDrop}
      onDragOver={disabled ? undefined : handleDragOver}
      onDragLeave={disabled ? undefined : handleDragLeave}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx"
        onChange={handleInputChange}
        disabled={disabled}
        className={`absolute inset-0 w-full h-full opacity-0 ${
          disabled ? "cursor-not-allowed" : "cursor-pointer"
        }`}
      />

      <div className="flex flex-col items-center">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
            disabled
              ? "bg-gray-100 dark:bg-gray-700"
              : isDragOver
              ? "bg-blue-100 dark:bg-blue-900/40"
              : "bg-gray-100 dark:bg-gray-700"
          }`}
        >
          <Upload
            className={`w-6 h-6 ${
              disabled
                ? "text-gray-400 dark:text-gray-500"
                : isDragOver
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-600 dark:text-gray-400"
            }`}
          />
        </div>

        <h4
          className={`text-lg font-medium mb-2 ${
            disabled
              ? "text-gray-400 dark:text-gray-500"
              : "text-gray-900 dark:text-white"
          }`}
        >
          {disabled
            ? "File selected"
            : isDragOver
            ? "Drop file here"
            : "Choose an Excel file or drag & drop"}
        </h4>

        <p
          className={`text-sm mb-4 ${
            disabled
              ? "text-gray-400 dark:text-gray-500"
              : "text-gray-600 dark:text-gray-400"
          }`}
        >
          {disabled
            ? "Remove file to add another"
            : "Only .xlsx Excel file is supported"}
        </p>

        <button
          onClick={() => !disabled && fileInputRef.current?.click()}
          disabled={disabled}
          className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
            disabled
              ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          <Upload className="w-4 h-4 mr-2" />
          Browse Files
        </button>
      </div>
    </div>
  );
};

export default UploadFilesArea;
