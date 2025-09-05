// import axios from "axios"; // Import axios in your project
import React, { useEffect, useState, useContext } from "react";
import { Trash2, ChevronUp, ChevronDown } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "../../../components/ui/table";
import axios from "axios";
import { Link, useParams } from "react-router";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import ActionButtons from "./components/ActionButtons";
// import Statistics from "./components/Statistics";
import NoReportFound from "./components/NoReportFound";
import LoadingReports from "./components/LoadingReports";
// import axiosInstance from "../../../api/axiosInstance";
import { getSortedReports } from "../../../utils/reports/getSortedReports";
import FileIcon from "../../../components/common/FileIcon";
import { ReportsContext } from "../../../context/ReportsContext";
import { formatDate } from "../../../utils/reports/formatDate";
import { useUserContext } from "../../../context/UserContext";
import SummaryAndKPIs from "./components/SummaryAndKPIs";

const ReportsList = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const authToken = localStorage.getItem("authToken");
  const { reports, loading, fetchReports } = useContext(ReportsContext);
  const { user, loadUsersList, users } = useUserContext();
  const { userId } = useParams();

  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "filename",
    direction: "asc",
  });

  let filteredReports = reports;

  if (userId) {
    filteredReports = reports?.filter((r) => r.user_id === Number(userId));
  } else if (user?.id) {
    filteredReports = reports?.filter((r) => r.user_id === user.id);
  }

  const userDetails = users?.find((user) => user.id === parseInt(userId));

  const sortedReports = filteredReports
    ? getSortedReports(filteredReports[0]?.reports, sortConfig)
    : [];

  useEffect(() => {
    if (!authToken) {
      alert("Authentication token not found. Please log in again.");
      return;
    }
    if (reports && reports.length == 0) {
      fetchReports(true);
    } else {
      fetchReports();
    }
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!users) {
        await loadUsersList();
      }
    };

    fetchUsers();
  }, []);

  const handleSelectAll = () => {
    if (selectedItems.size === (sortedReports?.length || 0)) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(sortedReports.map((report) => report.id)));
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
      const selectedReports = sortedReports.filter((report) =>
        selectedItems.has(report.id)
      );

      for (const report of selectedReports) {
        // Create a temporary link element to trigger download
        const link = document.createElement("a");
        link.href = report.url;
        link.download = report.filename;
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

  // Common delete function
  const deleteReports = async (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) return;
    setIsDeleting(true);
    try {
      await axios.delete(`${baseUrl}/reports/delete/`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        data: { ids: ids },
      });
      alert(`Successfully deleted ${ids.length} file(s).`);
      await fetchReports(true);
    } catch (error) {
      console.error("Error deleting files:", error);
      alert("Failed to delete some files. Please try again.");
    } finally {
      setIsDeleting(false);
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
    await deleteReports(Array.from(selectedItems));
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
      <PageBreadcrumb
        pageTitle={
          userId
            ? `Reports - ${userDetails && userDetails?.username}`
            : "Reports"
        }
        path={
          userId
            ? ["Users List", `${userDetails && userDetails?.id}`, "Reports"]
            : "Reports"
        }
      />
      {/* Header Card */}

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="px-6 py-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-base font-medium text-gray-800 dark:text-white/90 my-2">
                Analytics & Summary
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

        <SummaryAndKPIs reports={sortedReports} selectedItems={selectedItems} />

        {/* Statistics */}
        {/* <Statistics reports={sortedReports} selectedItems={selectedItems} /> */}
      </div>

      {/* Table Card */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          {loading ? (
            <LoadingReports />
          ) : sortedReports?.length === 0 ? (
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
                        selectedItems.size === (sortedReports?.length || 0) &&
                        (sortedReports?.length || 0) > 0
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
                      onClick={() => requestSort("filename")}
                      className="flex items-center gap-1"
                    >
                      File
                      {sortConfig.key === "filename" ? (
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
                      onClick={() => requestSort("file_size_mb")}
                      className="flex items-center gap-1"
                    >
                      Size
                      {sortConfig.key === "file_size_mb" ? (
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
                      onClick={() => requestSort("uploaded_at")}
                      className="flex items-center gap-1"
                    >
                      Created At
                      {sortConfig.key === "uploaded_at" ? (
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
                  {!userId && (
                    <TableCell
                      isHeader
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Actions
                    </TableCell>
                  )}
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {sortedReports.map((report) => (
                  <TableRow
                    key={report.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                      selectedItems.has(report.id)
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : ""
                    }`}
                  >
                    <TableCell className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(report.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectItem(report.id);
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </TableCell>

                    <TableCell className="px-6 py-4">
                      <Link to={`${report.id}`} className="flex items-center">
                        <div className="flex-shrink-0 mr-3">
                          <FileIcon fileName={report.filename} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white  hover:text-blue-600 dark:hover:text-blue-500 hover:underline">
                            {report.filename}
                          </p>
                        </div>
                      </Link>
                    </TableCell>

                    <TableCell className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {report.file_size_mb ? `${report.file_size_mb} MB` : "-"}
                    </TableCell>

                    <TableCell className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {formatDate(report.uploaded_at)}
                    </TableCell>

                    {!userId && (
                      <TableCell className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const confirmDelete = window.confirm(
                                `Are you sure you want to delete "${report.filename}"?`
                              );
                              if (confirmDelete) {
                                await deleteReports([report.id]);
                              }
                            }}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    )}
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

export default ReportsList;
