import { useEffect, useState } from "react";
import {
  AlertCircle,
  Eye,
  FileVideo,
  Loader2,
  PencilLine,
  Trash2,
  Upload,
} from "lucide-react";
import axiosInstance from "../../../api/axiosInstance";
import { Modal } from "../../../components/ui/modal";
import { Button } from "../components/ui/Button";
import { useNavigate } from "react-router-dom";
import {
  UploadedVideo,
  useFightRecapVideos,
} from "../context/FightRecapVideosContext";

interface UploadVideoResponse extends UploadedVideo {
  status: string;
  message: string;
}

interface ErrorWithResponseData {
  response?: {
    data?: {
      message?: string;
      detail?: string;
    };
  };
  message?: string;
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

const getErrorMessage = (error: unknown, fallback: string) => {
  const normalizedError = error as ErrorWithResponseData;
  return (
    normalizedError?.response?.data?.message ||
    normalizedError?.response?.data?.detail ||
    normalizedError?.message ||
    fallback
  );
};

const VideosList = () => {
  const {
    videos,
    isLoading,
    fetchError,
    fetchVideos,
    upsertVideo,
    createSessionForVideo,
    removeVideo,
  } = useFightRecapVideos();
  const navigate = useNavigate();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<UploadedVideo | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [creatingSessionVideoId, setCreatingSessionVideoId] = useState<
    number | null
  >(null);

  useEffect(() => {
    void fetchVideos();
  }, [fetchVideos]);

  const openUploadModal = () => {
    setUploadError("");
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploadModalOpen(true);
  };

  const closeUploadModal = () => {
    if (isUploading) return;
    setUploadError("");
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploadModalOpen(false);
  };

  const openDeleteModal = (video: UploadedVideo) => {
    if (isDeleting) return;
    setDeleteError("");
    setVideoToDelete(video);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;
    setDeleteError("");
    setVideoToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError("Please select a video file before uploading.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError("");

    try {
      const response = await axiosInstance.post<UploadVideoResponse>(
        "/reports/video-upload/",
        formData,
        {
          onUploadProgress: (progressEvent) => {
            const total = progressEvent.total || selectedFile.size || 1;
            const progress = Math.round((progressEvent.loaded * 100) / total);
            setUploadProgress(Math.min(Math.max(progress, 0), 100));
          },
        },
      );

      const uploadedVideo = response.data;
      upsertVideo(uploadedVideo);

      setUploadProgress(100);
      closeUploadModal();
    } catch (error) {
      setUploadError(
        getErrorMessage(error, "Failed to upload video. Please try again."),
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteVideo = async () => {
    if (!videoToDelete) {
      setDeleteError("No video selected for deletion.");
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      await axiosInstance.delete(`/reports/my-video-urls/${videoToDelete.id}/`);

      removeVideo(videoToDelete.id);

      setIsDeleteModalOpen(false);
      setVideoToDelete(null);
      setDeleteError("");
    } catch (error) {
      setDeleteError(
        getErrorMessage(error, "Failed to delete video. Please try again."),
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAnnotateClick = async (video: UploadedVideo) => {
    const hasSession =
      video.session_id !== null && video.session_id !== undefined;

    if (hasSession) {
      navigate(`annotate/${video.id}`);
      return;
    }

    setCreatingSessionVideoId(video.id);
    try {
      await createSessionForVideo(video.id);
      navigate(`annotate/${video.id}`);
    } catch (error) {
      alert(
        getErrorMessage(
          error,
          "Failed to start annotation session. Please try again.",
        ),
      );
    } finally {
      setCreatingSessionVideoId(null);
    }
  };

  const hasVideos = videos.length > 0;

  return (
    <div className="fight-recap-screen min-h-screen bg-background">
      <main className="p-6 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-6 animate-lift-in">
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
                    onClick={() => void fetchVideos(true)}
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
                  className="rounded-lg border border-border bg-background p-4 space-y-3 animate-lift-in"
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
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => void handleAnnotateClick(video)}
                        disabled={creatingSessionVideoId !== null}
                        className="inline-flex items-center gap-1.5 text-primary text-sm font-medium hover:underline whitespace-nowrap"
                      >
                        {video.session_status?.trim().toLowerCase() ===
                        "completed" ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <PencilLine className="w-4 h-4" />
                        )}
                        {creatingSessionVideoId === video.id &&
                        (video.session_id === null ||
                          video.session_id === undefined) ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        ) : video.session_status?.trim().toLowerCase() ===
                          "completed" ? (
                          "View Annotation"
                        ) : video.session_id !== null &&
                          video.session_id !== undefined ? (
                          "Continue Annotating"
                        ) : (
                          "Start Annotation"
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => openDeleteModal(video)}
                        className="inline-flex items-center gap-1.5 text-red-500 text-sm font-medium hover:text-red-400 transition-colors whitespace-nowrap"
                        disabled={isDeleting}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Video
                      </button>
                    </div>
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
          <p className="text-sm text-gray-600    dark:text-gray-300 mb-4">
            Select a video file to upload.
          </p>

          <input
            type="file"
            accept="video/*"
            onChange={(event) =>
              setSelectedFile(event.target.files?.[0] ?? null)
            }
            className="block w-full text-sm text-gray-700 dark:text-gray-200 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:cursor-pointer file:bg-red-500 file:text-white hover:file:bg-red-600"
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

          {isUploading && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mb-2">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
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

      <Modal
        className="max-w-xl mx-4"
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        showCloseButton={false}
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Delete Video
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Are you sure you want to delete{" "}
            <span className="font-medium break-all">
              {videoToDelete?.file_name || "this video"}
            </span>
            ? This action cannot be undone.
          </p>

          {deleteError && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">
              {deleteError}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <Button
              onClick={closeDeleteModal}
              variant="outline"
              disabled={isDeleting}
              className="text-gray-900 dark:text-white"
            >
              Cancel
            </Button>
            <button
              type="button"
              onClick={handleDeleteVideo}
              disabled={isDeleting || !videoToDelete}
              className="inline-flex items-center justify-center gap-2 h-10 px-4 py-2 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:pointer-events-none disabled:opacity-50 transition-colors"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Confirm Delete
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default VideosList;
