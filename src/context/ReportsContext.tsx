import { createContext, useCallback, useState } from "react";
import axiosInstance from "../api/axiosInstance";

export interface ReportsContextType {
  reports: any; // or your actual type
  loading: boolean;
  error: string;
  fetchReports: (forceRefresh?: boolean) => Promise<void>;
  clearReports: () => void;
  hasData: boolean;
}

export const ReportsContext = createContext<ReportsContextType | undefined>(
  undefined
);

// Reports Provider Component
export const ReportsProvider = ({ children }) => {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReports = useCallback(
    async (forceRefresh = false) => {
      // If data already exists and not forcing refresh, return early
      if (reports && !forceRefresh) {
        return reports;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await axiosInstance.get("/reports/my-files/");
        const reportsData = response.data;

        // Convert all filenames from .xlsx to .pdf
        const updatedReportsData = reportsData.map((report) => {
          if (report.filename && report.filename.endsWith(".xlsx")) {
            return {
              ...report,
              filename: report.filename.replace(/\.xlsx$/i, ".pdf"),
            };
          }
          return report;
        });

        setReports(updatedReportsData);
        return reportsData;
      } catch (err) {
        console.error("Error fetching reports:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to fetch reports"
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [reports]
  );

  const clearReports = useCallback(() => {
    setReports(null);
    setError(null);
  }, []);

  const value = {
    reports,
    loading,
    error,
    fetchReports,
    clearReports,
    hasData: reports !== null,
  };

  return (
    <ReportsContext.Provider value={value}>{children}</ReportsContext.Provider>
  );
};
