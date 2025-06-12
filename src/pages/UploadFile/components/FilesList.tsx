import React from "react";
import FileInfo from "./FileInfo";
import UploadProgress from "./UploadProgress";
import RemoveButton from "./RemoveButton";
import FileIconSection from "./FileIcon";

const FilesList = ({ files, uploadProgress, removeFile }) => {
  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 "
        >
          {/* File Icon/Preview */}
          <FileIconSection file={file} />

          {/* File Info */}
          <FileInfo file={file} />

          {/* Upload Progress */}
          <UploadProgress file={file} uploadProgress={uploadProgress} />

          {/* Remove Button */}
          <RemoveButton file={file} removeFile={removeFile} />
        </div>
      ))}
    </div>
  );
};

export default FilesList;
