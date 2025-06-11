import React, { useState, useRef } from "react";
import { Upload, Loader2 } from "lucide-react";
import axios from "axios";
import ComponentCard from "../../../components/common/ComponentCard";
// import FileInfo from "./FileInfo";
// import UploadProgress from "./UploadProgress";
// import RemoveButton from "./RemoveButton";
// import FileIcon from "./FileIcon";
import FilesList from "./FilesList";
import UploadStatistics from "./UploadStatistics";
import UploadFilesArea from "./UploadFilesArea";

const FileUpload = () => {
  const [files, setFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({}); // Initialize as empty object
  const fileInputRef = useRef(null);

  const MAX_FILES = 5;
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  const handleFileSelect = (selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles);

    // Check if adding these files would exceed the limit
    const availableSlots = MAX_FILES - files.length;
    if (fileArray.length > availableSlots) {
      alert(
        `You can only upload a maximum of ${MAX_FILES} files. You have ${availableSlots} slots remaining.`
      );
      return;
    }

    const newFiles = fileArray.map((file: File) => ({
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

    // Don't allow drop if max files reached
    if (files.length >= MAX_FILES) {
      alert(`Maximum of ${MAX_FILES} files allowed.`);
      return;
    }

    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    // Only show drag over effect if we can accept more files
    if (files.length < MAX_FILES) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleInputChange = (e) => {
    // Don't allow file selection if max files reached
    if (files.length >= MAX_FILES) {
      alert(`Maximum of ${MAX_FILES} files allowed.`);
      e.target.value = null;
      return;
    }

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

    const formData = new FormData();

    pendingFiles.forEach((fileItem) => {
      formData.append("file", fileItem.file); // append under same key
    });

    // Mark all files as uploading
    setFiles((prev) =>
      prev.map((f) =>
        pendingFiles.find((pf) => pf.id === f.id)
          ? { ...f, status: "uploading" }
          : f
      )
    );

    try {
      const response = await axios.post(
        `${baseUrl}/reports/upload/`,
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
            // Apply the same progress to all files for simplicity
            setUploadProgress((prev) => {
              const newProgress = { ...prev };
              pendingFiles.forEach((file) => {
                newProgress[file.id] = progress;
              });
              return newProgress;
            });
          },
        }
      );

      setFiles((prev) =>
        prev.map((f) =>
          pendingFiles.find((pf) => pf.id === f.id)
            ? { ...f, status: "completed" }
            : f
        )
      );

      console.log("Files uploaded successfully:", response.data);
    } catch (error) {
      console.error("Error uploading files:", error);

      setFiles((prev) =>
        prev.map((f) =>
          pendingFiles.find((pf) => pf.id === f.id)
            ? { ...f, status: "error" }
            : f
        )
      );

      if (error.response?.status === 401) {
        alert("Authentication failed. Please login again.");
      } else if (error.response?.status === 413) {
        alert("Some file(s) are too large to upload.");
      } else {
        alert("Failed to upload files. Please try again.");
      }
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  };

  // Calculate overall progress for the progress bar
  const calculateOverallProgress = () => {
    const uploadingFiles = files.filter((f) => f.status === "uploading");
    if (uploadingFiles.length === 0) return 0;

    const totalProgress = uploadingFiles.reduce((sum, file) => {
      return sum + (uploadProgress[file.id] || 0);
    }, 0);

    return Math.round(totalProgress / uploadingFiles.length);
  };

  const overallProgress = calculateOverallProgress();

  return (
    <ComponentCard title="Upload your files by clicking or dragging them here">
      <div className="p-6">
        {/* File limit indicator */}
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {files.length} of {MAX_FILES} files selected
          </div>
          {files.length >= MAX_FILES && (
            <div className="text-sm text-amber-600 dark:text-amber-400 font-medium">
              Maximum files reached
            </div>
          )}
        </div>

        <UploadFilesArea
          isDragOver={isDragOver}
          handleDrop={handleDrop}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
          fileInputRef={fileInputRef}
          handleInputChange={handleInputChange}
          disabled={files.length >= MAX_FILES}
        />

        {/* File List */}
        {files.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Selected Files ({files.length})
            </h4>

            <FilesList
              files={files}
              uploadProgress={uploadProgress}
              removeFile={removeFile}
            />

            {/* Overall Upload Progress */}
            {isUploading && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>Uploading files...</span>
                  <span>{overallProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${overallProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

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
                      Upload All Files (
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
        <UploadStatistics files={files} />
      </div>
    </ComponentCard>
  );
};

export default FileUpload;
