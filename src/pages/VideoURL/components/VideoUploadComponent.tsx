import { useContext, useState } from "react";
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import VideoUploadGuides from "./VideoUploadGuides";
import axiosInstance from "../../../api/axiosInstance";
import URLsList from "../../../components/reports/URLsList";
import { ReportsContext } from "../../../context/ReportsContext";

const VideoUploadComponent = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // null, 'success', 'error'
  const [uploadedVideos, setUploadedVideos] = useState([]);

  const { fetchReports } = useContext(ReportsContext);

  const validateUrl = (url) => {
    const youtubeRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/;
    const driveRegex = /^https:\/\/drive\.google\.com\/(file\/d\/|open\?id=)/;
    return youtubeRegex.test(url) || driveRegex.test(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!videoUrl.trim() || !validateUrl(videoUrl)) {
      setUploadStatus("error");
      return;
    }

    setIsLoading(true);
    setUploadStatus(null);

    try {
      // ✅ API call using axiosInstance
      const response = await axiosInstance.post("/reports/video-url/", {
        video_url: videoUrl,
      });

      // You can adjust according to API response structure
      const newVideo = {
        id:
          response.data?.id ||
          `VID-${String(uploadedVideos.length + 1).padStart(3, "0")}`,
        url: videoUrl,
        uploadedAt: new Date().toISOString(),
      };

      setUploadedVideos((prev) => [newVideo, ...prev]);
      setVideoUrl("");
      setUploadStatus("success");
      await fetchReports(true);
      setTimeout(() => setUploadStatus(null), 3000);
    } catch (error) {
      console.error("Video upload failed:", error);
      setUploadStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <VideoUploadGuides />

      {/* Upload Form */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Upload Video URL
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="videoUrl"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Video URL
            </label>
            <input
              type="url"
              id="videoUrl"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=... or https://drive.google.com/..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Status Messages */}
          {uploadStatus === "success" && (
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Video uploaded successfully!</span>
            </div>
          )}

          {uploadStatus === "error" && (
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">
                {!videoUrl.trim()
                  ? "Please enter a video URL."
                  : "Upload failed. Please check the URL or try again."}
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !videoUrl.trim()}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Video
              </>
            )}
          </button>
        </form>
      </div>

      <URLsList />

      {/* Uploaded Videos Table */}
      {/* {uploadedVideos.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.05]">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Uploaded Videos ({uploadedVideos.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-100 dark:border-white/[0.05]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Video ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Video URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Upload Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {uploadedVideos.map((video) => (
                  <tr
                    key={video.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {video.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        {getUrlIcon(video.url)}
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                          title={video.url}
                        >
                          {truncateUrl(video.url)}
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {formatDateTime(video.uploadedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default VideoUploadComponent;
