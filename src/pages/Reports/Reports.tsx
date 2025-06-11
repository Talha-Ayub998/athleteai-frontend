// import axios from "axios"; // Import axios in your project
import React, { useEffect, useState } from "react";
import {
  Download,
  Trash2,
  File,
  FileText,
  Image,
  Video,
  Music,
} from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "../../components/ui/table";
import axios from "axios";
import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

const Reports = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const authToken = localStorage.getItem("authToken");

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!authToken) {
      alert("Authentication token not found. Please log in again.");
      return;
    }

    getReportsList();
  }, [authToken, baseUrl]);

  const getReportsList = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${baseUrl}/reports/my-files/`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      setReports(response.data);
      setSelectedItems(new Set()); // Clear selections when data refreshes
    } catch (error) {
      console.error("Error fetching reports:", error);
      alert("Failed to fetch reports.");
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split(".").pop()?.toLowerCase();

    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension)) {
      return <Image className="w-5 h-5 text-blue-500" />;
    }
    if (["mp4", "avi", "mov", "wmv", "flv"].includes(extension)) {
      return <Video className="w-5 h-5 text-purple-500" />;
    }
    if (["mp3", "wav", "flac", "aac"].includes(extension)) {
      return <Music className="w-5 h-5 text-green-500" />;
    }
    if (["pdf", "doc", "docx", "txt"].includes(extension)) {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const handleSelectAll = () => {
    if (selectedItems.size === reports.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(reports.map((report) => report.key)));
    }
  };

  const handleSelectItem = (key) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedItems(newSelected);
  };

  const handleDownload = async () => {
    if (selectedItems.size === 0) {
      alert("Please select files to download.");
      return;
    }

    setIsDownloading(true);

    try {
      const selectedReports = reports.filter((report) =>
        selectedItems.has(report.key)
      );

      for (const report of selectedReports) {
        // Create a temporary link element to trigger download
        const link = document.createElement("a");
        link.href = report.url;
        link.download = report.original_name;
        link.target = "_blank"; // Open in new tab as fallback
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Small delay between downloads to avoid overwhelming the browser
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      alert(`Started downloading ${selectedReports.length} file(s).`);
    } catch (error) {
      console.error("Error downloading files:", error);
      alert("Failed to download some files.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (selectedItems.size === 0) {
      alert("Please select files to delete.");
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedItems.size} selected file(s)? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    setIsDeleting(true);

    try {
      const keys = Array.from(selectedItems); // assuming selectedItems is a Set of file keys

      await axios.delete(`${baseUrl}/reports/delete/`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        data: { keys }, // correct format as shown in Postman screenshot
      });

      alert(`Successfully deleted ${selectedItems.size} file(s).`);

      // Refresh the list
      await getReportsList();
    } catch (error) {
      console.error("Error deleting files:", error);
      alert("Failed to delete some files. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!authToken) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <p className="text-red-500">
          Authentication required. Please log in again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="My Reports" />
      {/* Header Card */}

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="px-6 py-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-base font-medium text-gray-800 dark:text-white/90 my-2">
                Manage your uploaded files and reports
              </p>
            </div>

            {/* Action Buttons */}
            {selectedItems.size > 0 && (
              <div className="flex space-x-3">
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-md transition-colors duration-200"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isDownloading
                    ? "Downloading..."
                    : `Download (${selectedItems.size})`}
                </button>

                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-medium rounded-md transition-colors duration-200"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isDeleting
                    ? "Deleting..."
                    : `Delete (${selectedItems.size})`}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Statistics */}
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
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Selected
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {reports.reduce(
                  (total, report) => total + report.size_bytes,
                  0
                ) > 0
                  ? formatFileSize(
                      reports.reduce(
                        (total, report) => total + report.size_bytes,
                        0
                      )
                    )
                  : "0 Bytes"}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Size
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">
                Loading reports...
              </span>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12">
              <File className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                No reports found
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                Upload some files to get started
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell
                    isHeader
                    className="px-6 py-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    <input
                      type="checkbox"
                      checked={
                        selectedItems.size === reports.length &&
                        reports.length > 0
                      }
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    File
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Size
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Created At
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {reports.map((report) => (
                  <TableRow
                    key={report.key}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                      selectedItems.has(report.key)
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : ""
                    }`}
                  >
                    <TableCell className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(report.key)}
                        onChange={() => handleSelectItem(report.key)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </TableCell>

                    <TableCell className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 mr-3">
                          {getFileIcon(report.original_name)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {report.original_name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {report.stored_name}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {formatFileSize(report.size_bytes)}
                    </TableCell>

                    <TableCell className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {formatDate(report.last_modified)}
                    </TableCell>

                    <TableCell className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = report.url;
                            link.download = report.original_name;
                            link.target = "_blank";
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        <button
                          onClick={async () => {
                            const confirmDelete = window.confirm(
                              `Are you sure you want to delete "${report.original_name}"?`
                            );
                            if (confirmDelete) {
                              try {
                                await axios.delete(
                                  `${baseUrl}/reports/delete/`,
                                  {
                                    headers: {
                                      Authorization: `Bearer ${authToken}`,
                                      "Content-Type": "application/json",
                                    },
                                    data: {
                                      keys: [report.key], // Send in array format as required by backend
                                    },
                                  }
                                );
                                alert("File deleted successfully.");
                                await getReportsList();
                              } catch (error) {
                                console.error("Error deleting file:", error);
                                alert("Failed to delete file.");
                              }
                            }
                          }}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
