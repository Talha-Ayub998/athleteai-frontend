import React, { useContext, useEffect } from "react";
import { ReportsContext } from "../../context/ReportsContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Youtube, HardDrive, ExternalLink } from "lucide-react";

type URLsListProps = {
  URLSelectedUserId?: number;
  selectedUserName?: string;
};

const URLsList = ({ URLSelectedUserId, selectedUserName }: URLsListProps) => {
  const { reports, loading, fetchReports } = useContext(ReportsContext);

  useEffect(() => {
    if (!reports) fetchReports(true);
  }, [reports, fetchReports]);

  const formatDateTime = (dateString) => new Date(dateString).toLocaleString();

  const getUrlType = (url) => {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      return "youtube";
    } else if (url.includes("drive.google.com")) {
      return "drive";
    }
    return "other";
  };

  const getUrlIcon = (url) => {
    const type = getUrlType(url);
    if (type === "youtube") {
      return <Youtube className="w-4 h-4 text-red-500" />;
    } else if (type === "drive") {
      return <HardDrive className="w-4 h-4 text-blue-500" />;
    }
    return <ExternalLink className="w-4 h-4 text-gray-500" />;
  };

  const truncateUrl = (url, maxLength = 50) =>
    url.length <= maxLength ? url : url.substring(0, maxLength) + "...";

  // Filter reports for the selected/current user and extract video URLs
  const selectedUserReports =
    (URLSelectedUserId
      ? reports?.filter((r) => r.user_id === URLSelectedUserId)
      : reports?.slice(0, 1)) || [];

  // Collect all video URLs from the selected user's reports
  const videoUrls = selectedUserReports.flatMap(
    (report) => report.video_urls || []
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-gray-500">Loading video URLs...</div>
      </div>
    );
  }

  if (videoUrls.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-gray-500">No video URLs found for this user.</div>
      </div>
    );
  }

  return (
    <div>
      {/* Heading */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {selectedUserName ? `${selectedUserName}'s` : "Your"} Video URLs
        </h2>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            {/* Table Header */}
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  ID
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Video URL
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Created At
                </TableCell>
              </TableRow>
            </TableHeader>

            {/* Table Body */}
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {videoUrls.map((videoUrl) => (
                <TableRow key={videoUrl.id}>
                  <TableCell className="px-5 py-4 text-start">
                    <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                      {videoUrl.id}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-start">
                    <div className="flex items-center gap-2">
                      {getUrlIcon(videoUrl.url)}
                      <a
                        href={videoUrl.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-theme-sm hover:underline"
                        title={videoUrl.url}
                      >
                        {truncateUrl(videoUrl.url)}
                      </a>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {formatDateTime(videoUrl.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default URLsList;
