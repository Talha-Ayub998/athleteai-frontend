import React, { useState, useRef, useEffect, useContext } from "react";
import { Loader2 } from "lucide-react";
import ComponentCard from "../../../components/common/ComponentCard";
import axiosInstance from "../../../api/axiosInstance";
import UploadFilesArea from "./UploadFilesArea";
import FilesList from "./FilesList";
import { Modal } from "../../../components/ui/modal";
import { getStatusText } from "../../../utils/files/getStatusText";
import { ReportsContext } from "../../../context/ReportsContext";

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const { fetchReports } = useContext(ReportsContext);

  useEffect(() => {
    if (
      isUploading &&
      file &&
      file.status === "uploading" &&
      uploadProgress === 100
    ) {
      setFile((prev) => ({ ...prev, status: "processing" }));
    }
  }, [isUploading, uploadProgress, file]);

  const handleFileSelect = (selectedFiles: FileList | File[]) => {
    setError("");
    const selectedFile = Array.from(selectedFiles)[0];
    if (!selectedFile) return;
    if (!selectedFile.name.endsWith(".xlsx")) {
      setError("Only .xlsx Excel files are allowed.");
      return;
    }
    setFile({
      id: Date.now() + Math.random(),
      file: selectedFile,
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type,
      preview: null,
      status: "pending",
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (file) {
      alert(
        "Only one file can be uploaded. Remove the current file to add another."
      );
      return;
    }
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect([droppedFile]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!file) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleInputChange = (e) => {
    if (file) {
      alert(
        "Only one file can be uploaded. Remove the current file to add another."
      );
      e.target.value = null;
      return;
    }
    handleFileSelect(e.target.files);
    e.target.value = null;
  };

  const removeFile = () => {
    setFile(null);
    setError("");
  };

  const uploadFile = async () => {
    setError("");
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      setError("Authentication token not found. Please login again.");
      return;
    }
    if (!file || (file.status !== "pending" && file.status !== "error")) {
      setError("No file to upload.");
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);
    setFile((prev) => ({ ...prev, status: "uploading" }));
    const formData = new FormData();
    formData.append("file", file.file);
    try {
      const response = await axiosInstance.post("/reports/upload/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${authToken}`,
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(progress);
        },
      });
      setFile((prev) => ({ ...prev, status: "completed" }));
      await fetchReports(true);
      console.log("File uploaded successfully:", response.data);
    } catch (error) {
      console.error("Error uploading file:", error);
      setFile((prev) => ({ ...prev, status: "error" }));
      if (error.response?.status === 401) {
        setError("Authentication failed. Please login again.");
      } else if (error.response?.status === 413) {
        setError("File is too large to upload.");
      } else if (
        error.response?.status === 400 &&
        error.response?.data?.status === "duplicate"
      ) {
        const msg = error.response.data.message || "Duplicate file upload.";
        const existing = error.response.data.existing_filename
          ? `\nExisting file: ${error.response.data.existing_filename}`
          : "";
        const uploadedAt = error.response.data.uploaded_at
          ? `\nUploaded at: ${new Date(
              error.response.data.uploaded_at
            ).toLocaleString()}`
          : "";
        setError(`${msg}${existing}${uploadedAt}`);
      } else if (
        error.response?.data?.status === "error" &&
        error.response?.data?.errors
      ) {
        const errors = error.response.data.errors;
        if (Array.isArray(errors)) {
          setError(errors.join("\n"));
        } else {
          setError(errors);
        }
      } else {
        setError("Failed to upload file. Please try again.");
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <ComponentCard title="Upload your Excel file by clicking or dragging it here">
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {file ? "1 file selected" : "No file selected"}
          </div>
          {file && (
            <div className="text-sm text-amber-600 dark:text-amber-400 font-medium">
              File selected
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
          disabled={!!file}
        />
        {file && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Selected File
            </h4>
            <FilesList
              files={[file]}
              // uploadProgress={{ [file.id]: uploadProgress }}
              removeFile={() => removeFile()}
            />
            <Modal
              className="max-w-10/12 md:max-w-4/12"
              isOpen={!!error}
              onClose={() => setError("")}
            >
              <div className="p-6 text-center">
                <div className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                  Error
                </div>
                <div className="text-base text-gray-700 dark:text-gray-200 whitespace-pre-line">
                  {error}
                </div>
              </div>
            </Modal>
            {isUploading && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>{getStatusText(file.status)}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
            <div className="flex items-center space-x-3 mt-4 ">
              <button
                onClick={removeFile}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isUploading}
              >
                Clear
              </button>
              <button
                className="px-4 py-2 text-sm  font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-md transition-colors duration-200 flex items-center"
                onClick={uploadFile}
                disabled={
                  isUploading ||
                  !file ||
                  (file.status !== "pending" && file.status !== "error")
                }
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Upload File"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </ComponentCard>
  );
};

export default FileUpload;
