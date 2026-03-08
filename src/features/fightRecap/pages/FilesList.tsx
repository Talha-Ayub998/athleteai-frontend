import { useCallback, useEffect, useState } from "react";
import { AlertCircle, FileVideo, Loader2, Upload } from "lucide-react";
import axiosInstance from "../../../api/axiosInstance";
import { Modal } from "../../../components/ui/modal";
import { Button } from "../components/ui/Button";
import { Link } from "react-router";

interface UploadedVideo {
  id: number;
  url: string;
  s3_key: string;
  file_name: string;
  content_type: string;
  file_size_bytes: number;
  playback_url: string;
  created_at: string;
}

interface UploadedVideoListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: UploadedVideo[];
}

interface UploadVideoResponse extends UploadedVideo {
  status: string;
  message: string;
}

const formatFileSize = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** unitIndex;
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${
    units[unitIndex]
  }`;
};

const formatDate = (isoDate: string) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

const getErrorMessage = (error: any, fallback: string) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.detail ||
    error?.message ||
    fallback
  );
};

const FilesList = () => {
  const [videos, setVideos] = useState<UploadedVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const fetchVideos = useCallback(async () => {
    setIsLoading(true);
    setFetchError("");

    try {
      const response = await axiosInstance.get<UploadedVideoListResponse>(
        "/reports/my-video-urls/",
      );
      setVideos(response.data?.results ?? []);
    } catch (error) {
      setFetchError(getErrorMessage(error, "Failed to fetch uploaded videos."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchVideos();
  }, [fetchVideos]);

  const openUploadModal = () => {
    setUploadError("");
    setSelectedFile(null);
    setIsUploadModalOpen(true);
  };

  const closeUploadModal = () => {
    if (isUploading) return;
    setUploadError("");
    setSelectedFile(null);
    setIsUploadModalOpen(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError("Please select a video file before uploading.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setIsUploading(true);
    setUploadError("");

    try {
      const response = await axiosInstance.post<UploadVideoResponse>(
        "/reports/video-upload/",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      const uploadedVideo = response.data;
      setVideos((prev) => {
        const withoutDuplicate = prev.filter(
          (video) => video.id !== uploadedVideo.id,
        );
        return [uploadedVideo, ...withoutDuplicate];
      });

      closeUploadModal();
    } catch (error) {
      setUploadError(
        getErrorMessage(error, "Failed to upload video. Please try again."),
      );
    } finally {
      setIsUploading(false);
    }
  };

  const hasVideos = videos.length > 0;

  return (
    <div className="fight-recap-screen min-h-screen bg-background">
      <main className="p-6 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <FileVideo className="w-7 h-7 text-primary" />
                Uploaded Videos
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage and view your uploaded fight videos
              </p>
            </div>

            {hasVideos && (
              <Button
                onClick={openUploadModal}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Video
              </Button>
            )}
          </div>

          {isLoading && (
            <div className="bg-card rounded-lg border border-border p-8 flex items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading videos...
            </div>
          )}

          {!isLoading && fetchError && (
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-start gap-3 text-red-400">
                <AlertCircle className="w-5 h-5 mt-0.5" />
                <div>
                  <p className="font-medium">Could not load videos</p>
                  <p className="text-sm mt-1">{fetchError}</p>
                  <Button
                    onClick={fetchVideos}
                    variant="outline"
                    className="mt-4 text-foreground"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !fetchError && !hasVideos && (
            <div className="bg-card rounded-lg border border-border p-10 text-center">
              <FileVideo className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground">
                No videos uploaded yet
              </h2>
              <p className="text-muted-foreground mt-2 mb-6">
                Upload your first video to start building your video library.
              </p>
              <Button
                onClick={openUploadModal}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Video
              </Button>
            </div>
          )}

          {!isLoading && !fetchError && hasVideos && (
            <div className="bg-card rounded-lg border border-border p-6 space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Video List ({videos.length})
              </h2>

              {videos.map((video) => (
                <div
                  key={video.id}
                  className="rounded-lg border border-border bg-background p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-foreground font-medium break-all">
                        {video.file_name || "Untitled video"}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Uploaded: {formatDate(video.created_at)}
                      </p>
                    </div>
                    {/* <a
                      href={video.playback_url || video.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary text-sm font-medium hover:underline whitespace-nowrap"
                    >
                      Play Video
                    </a> */}
                    <Link
                      to={"annotate"}
                      className="text-primary text-sm font-medium hover:underline whitespace-nowrap"
                    >
                      Annotate Video
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <p className="text-foreground">
                        {video.content_type || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Size</p>
                      <p className="text-foreground">
                        {formatFileSize(video.file_size_bytes)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">ID</p>
                      <p className="text-foreground">{video.id}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Modal
        className="max-w-xl mx-4"
        isOpen={isUploadModalOpen}
        onClose={closeUploadModal}
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Upload Video
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Select a video file to upload.
          </p>

          <input
            type="file"
            accept="video/*"
            onChange={(event) =>
              setSelectedFile(event.target.files?.[0] ?? null)
            }
            className="block w-full text-sm text-gray-700 dark:text-gray-200 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            disabled={isUploading}
          />

          {selectedFile && (
            <p className="mt-3 text-sm text-gray-700 dark:text-gray-200 break-all">
              {selectedFile.name} ({formatFileSize(selectedFile.size)})
            </p>
          )}

          {uploadError && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">
              {uploadError}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <Button
              onClick={closeUploadModal}
              variant="outline"
              disabled={isUploading}
              className="text-gray-900 dark:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={isUploading || !selectedFile}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FilesList;
