// import axios from "axios"; // Import axios in your project
import React, { useEffect, useState } from "react";
import { Download, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "../../components/ui/table";
import axios from "axios";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ActionButtons from "./components/ActionButtons";
import Statistics from "./components/Statistics";
import NoReportFound from "./components/NoReportFound";
import LoadingReports from "./components/LoadingReports";
import { formatFileSize } from "../../utils/files/formatFileSize";
import axiosInstance from "../../api/axiosInstance";
import { getSortedReports } from "../../utils/reports/getSortedReports";
import FileIcon from "../../components/common/FileIcon";

const Reports = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const authToken = localStorage.getItem("authToken");

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "original_name",
    direction: "asc",
  });

  useEffect(() => {
    if (!authToken) {
      alert("Authentication token not found. Please log in again.");
      return;
    }

    getReportsList();
  }, []);

  const getReportsList = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/reports/my-files/");
      setReports(response.data);
      setSelectedItems(new Set()); // Clear selections when data refreshes
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
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

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
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
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Small delay between downloads to avoid overwhelming the browser
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
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

  const sortedReports = getSortedReports(reports, sortConfig);

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
            <ActionButtons
              selectedItems={selectedItems}
              handleDelete={handleDelete}
              handleDownload={handleDownload}
              isDeleting={isDeleting}
              isDownloading={isDownloading}
            />
          </div>
        </div>

        {/* Statistics */}
        <Statistics reports={reports} selectedItems={selectedItems} />
      </div>

      {/* Table Card */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          {loading ? (
            <LoadingReports />
          ) : reports.length === 0 ? (
            <NoReportFound />
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
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                  >
                    <button
                      onClick={() => requestSort("original_name")}
                      className="flex items-center gap-1"
                    >
                      File
                      {sortConfig.key === "original_name" ? (
                        sortConfig.direction === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )
                      ) : (
                        <div className="flex flex-col">
                          <ChevronUp className="w-3 h-3 -mb-1 text-gray-400" />
                          <ChevronDown className="w-3 h-3 text-gray-400" />
                        </div>
                      )}
                    </button>
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                  >
                    <button
                      onClick={() => requestSort("size_bytes")}
                      className="flex items-center gap-1"
                    >
                      Size
                      {sortConfig.key === "size_bytes" ? (
                        sortConfig.direction === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )
                      ) : (
                        <div className="flex flex-col">
                          <ChevronUp className="w-3 h-3 -mb-1 text-gray-400" />
                          <ChevronDown className="w-3 h-3 text-gray-400" />
                        </div>
                      )}
                    </button>
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    <button
                      onClick={() => requestSort("last_modified")}
                      className="flex items-center gap-1"
                    >
                      Created At
                      {sortConfig.key === "last_modified" ? (
                        sortConfig.direction === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )
                      ) : (
                        <div className="flex flex-col">
                          <ChevronUp className="w-3 h-3 -mb-1 text-gray-400" />
                          <ChevronDown className="w-3 h-3 text-gray-400" />
                        </div>
                      )}
                    </button>
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
                {sortedReports.map((report) => (
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
                          <FileIcon fileName={report.original_name} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {report.original_name}
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
