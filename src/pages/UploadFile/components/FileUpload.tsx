import React, { useState, useRef } from "react";
import {
  Upload,
  X,
  File,
  Image,
  FileText,
  Video,
  Music,
  Loader2,
} from "lucide-react";
import axios from "axios";

const FileUpload = () => {
  const [files, setFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);

  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  const handleFileSelect = (selectedFiles) => {
    const fileArray = Array.from(selectedFiles);
    const newFiles = fileArray.map((file) => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : null,
      status: "pending", // pending, uploading, completed, error
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleInputChange = (e) => {
    handleFileSelect(e.target.files);
    e.target.value = null; // Reset input to allow selecting same file again
  };

  const removeFile = (fileId) => {
    setFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === fileId);
      if (fileToRemove && fileToRemove.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter((f) => f.id !== fileId);
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (type) => {
    if (type.startsWith("image/"))
      return <Image className="w-5 h-5 text-blue-500" />;
    if (type.startsWith("video/"))
      return <Video className="w-5 h-5 text-purple-500" />;
    if (type.startsWith("audio/"))
      return <Music className="w-5 h-5 text-green-500" />;
    if (
      type.includes("pdf") ||
      type.includes("document") ||
      type.includes("text")
    )
      return <FileText className="w-5 h-5 text-red-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-gray-200 dark:bg-gray-600";
      case "uploading":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-200 dark:bg-gray-600";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "uploading":
        return "Uploading...";
      case "completed":
        return "Complete";
      case "error":
        return "Error";
      default:
        return "Pending";
    }
  };

  const uploadFiles = async () => {
    const authToken = localStorage.getItem("authToken");

    if (!authToken) {
      alert("Authentication token not found. Please login again.");
      return;
    }

    const pendingFiles = files.filter(
      (file) => file.status === "pending" || file.status === "error"
    );

    if (pendingFiles.length === 0) {
      alert("No files to upload.");
      return;
    }

    setIsUploading(true);

    try {
      // Upload files one by one
      for (const fileItem of pendingFiles) {
        // Update file status to uploading
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id ? { ...f, status: "uploading" } : f
          )
        );

        const formData = new FormData();
        formData.append("file", fileItem.file);

        try {
          const response = await axios.post(
            `${baseUrl}/reports/upload`,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${authToken}`,
              },
              onUploadProgress: (progressEvent) => {
                const progress = Math.round(
                  (progressEvent.loaded * 100) / progressEvent.total
                );
                setUploadProgress((prev) => ({
                  ...prev,
                  [fileItem.id]: progress,
                }));
              },
            }
          );

          // Update file status to completed
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileItem.id ? { ...f, status: "completed" } : f
            )
          );

          console.log(
            `File ${fileItem.name} uploaded successfully:`,
            response.data
          );
        } catch (error) {
          console.error(`Error uploading file ${fileItem.name}:`, error);

          // Update file status to error
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileItem.id ? { ...f, status: "error" } : f
            )
          );

          // Handle specific error cases
          if (error.response?.status === 401) {
            alert("Authentication failed. Please login again.");
          } else if (error.response?.status === 413) {
            alert(`File ${fileItem.name} is too large.`);
          } else {
            alert(`Failed to upload ${fileItem.name}. Please try again.`);
          }
        }
      }
    } catch (error) {
      console.error("Upload process failed:", error);
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          File Upload
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Upload your files by clicking or dragging them here
        </p>
      </div>

      {/* Upload Area */}
      <div className="p-6">
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
            isDragOver
              ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <div className="flex flex-col items-center">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                isDragOver
                  ? "bg-blue-100 dark:bg-blue-900/40"
                  : "bg-gray-100 dark:bg-gray-700"
              }`}
            >
              <Upload
                className={`w-6 h-6 ${
                  isDragOver
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              />
            </div>

            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {isDragOver ? "Drop files here" : "Choose files or drag & drop"}
            </h4>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Support for multiple file formats
            </p>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors duration-200"
            >
              <Upload className="w-4 h-4 mr-2" />
              Browse Files
            </button>
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Selected Files ({files.length})
            </h4>

            <div className="space-y-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  {/* File Icon/Preview */}
                  <div className="flex-shrink-0 mr-3">
                    {file.preview ? (
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="w-10 h-10 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-white dark:bg-gray-600 rounded-md flex items-center justify-center">
                        {getFileIcon(file.type)}
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>

                  {/* Upload Progress */}
                  <div className="flex-shrink-0 mr-3 w-24">
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getStatusColor(
                          file.status
                        )}`}
                        style={{
                          width:
                            file.status === "uploading"
                              ? `${uploadProgress[file.id] || 0}%`
                              : file.status === "completed"
                              ? "100%"
                              : "0%",
                        }}
                      ></div>
                    </div>
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

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFile(file.id)}
                    className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors duration-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  // Clean up preview URLs before clearing
                  files.forEach((file) => {
                    if (file.preview) {
                      URL.revokeObjectURL(file.preview);
                    }
                  });
                  setFiles([]);
                  setUploadProgress({});
                }}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isUploading}
              >
                Clear All
              </button>

              <div className="flex items-center space-x-3">
                {/* Upload Summary */}
                {files.length > 0 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {files.filter((f) => f.status === "completed").length} of{" "}
                    {files.length} completed
                  </div>
                )}

                <button
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isUploading}
                  onClick={() => {
                    // Reset only pending and error files
                    setFiles((prev) =>
                      prev.filter((f) => f.status === "completed")
                    );
                    setUploadProgress({});
                  }}
                >
                  Cancel
                </button>

                <button
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-md transition-colors duration-200 flex items-center"
                  onClick={uploadFiles}
                  disabled={
                    isUploading ||
                    files.filter(
                      (f) => f.status === "pending" || f.status === "error"
                    ).length === 0
                  }
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Files (
                      {
                        files.filter(
                          (f) => f.status === "pending" || f.status === "error"
                        ).length
                      }
                      )
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Statistics */}
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
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Failed
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
