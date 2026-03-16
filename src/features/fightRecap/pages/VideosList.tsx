import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
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
      <main className="overflow-y-auto px-4 py-5 sm:p-6">
        <div className="mx-auto max-w-5xl space-y-5 animate-lift-in sm:space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="flex items-center gap-2 text-xl font-bold text-foreground sm:gap-3 sm:text-2xl">
                <FileVideo className="h-6 w-6 text-primary sm:h-7 sm:w-7" />
                Uploaded Videos
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage and view your uploaded fight videos
              </p>
            </div>

            {hasVideos && (
              <Button
                onClick={openUploadModal}
                className="w-full bg-primary text-primary-foreground gap-2 hover:bg-primary/90 sm:w-auto"
              >
                <Upload className="w-4 h-4" />
                Upload Video
              </Button>
            )}
          </div>

          {isLoading && (
            <div className="bg-card rounded-lg border border-border p-6 text-muted-foreground sm:p-8">
              <div className="flex items-center justify-center gap-3 text-center">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading videos...
              </div>
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
                    className="mt-4 w-full text-foreground sm:w-auto"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !fetchError && !hasVideos && (
            <div className="bg-card rounded-lg border border-border p-6 text-center sm:p-10">
              <FileVideo className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground">
                No videos uploaded yet
              </h2>
              <p className="text-muted-foreground mt-2 mb-6">
                Upload your first video to start building your video library.
              </p>
              <Button
                onClick={openUploadModal}
                className="w-full bg-primary text-primary-foreground gap-2 hover:bg-primary/90 sm:w-auto"
              >
                <Upload className="w-4 h-4" />
                Upload Video
              </Button>
            </div>
          )}

          {!isLoading && !fetchError && hasVideos && (
            <div className="bg-card rounded-lg border border-border p-4 space-y-4 sm:p-6">
              <h2 className="text-lg font-semibold text-foreground">
                Video List ({videos.length})
              </h2>

              {videos.map((video) => {
                const isCompletedSession =
                  video.session_status?.trim().toLowerCase() === "completed";

                return (
                  <div
                    key={video.id}
                    className={`rounded-lg border bg-background p-4 space-y-4 animate-lift-in sm:p-5 ${
                      isCompletedSession
                        ? "bg-green-500/5 shadow-[0_0_0_1px_rgba(34,197,94,0.08)]"
                        : "border-border"
                    }`}
                    style={
                      isCompletedSession
                        ? { borderColor: "rgb(34 197 94 / 0.4)" }
                        : undefined
                    }
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="max-w-full text-foreground font-medium [overflow-wrap:anywhere]">
                            {video.file_name || "Untitled video"}
                          </p>
                          {isCompletedSession && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-green-300">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Completed
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
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
                      <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto md:flex-wrap md:justify-end">
                        <button
                          type="button"
                          onClick={() => void handleAnnotateClick(video)}
                          disabled={creatingSessionVideoId !== null}
                          className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-md border border-primary/20 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10 sm:w-auto"
                        >
                          {isCompletedSession ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <PencilLine className="w-4 h-4" />
                          )}
                          {creatingSessionVideoId === video.id &&
                          (video.session_id === null ||
                            video.session_id === undefined) ? (
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          ) : isCompletedSession ? (
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
                          className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-md border border-red-500/20 px-3 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10 hover:text-red-400 sm:w-auto"
                          disabled={isDeleting}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Video
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm lg:grid-cols-3">
                      <div className="col-span-2 min-w-0 lg:col-span-1">
                        <p className="text-muted-foreground">Type</p>
                        <p className="break-words text-foreground">
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
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Modal
        className="mx-4 w-[calc(100%-2rem)] max-w-xl"
        isOpen={isUploadModalOpen}
        onClose={closeUploadModal}
      >
        <div className="p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Upload Video
          </h3>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
            Select a video file to upload.
          </p>

          <input
            type="file"
            accept="video/*"
            onChange={(event) =>
              setSelectedFile(event.target.files?.[0] ?? null)
            }
            className="block w-full text-sm text-gray-700 dark:text-gray-200 file:mb-3 file:mr-0 file:w-full file:rounded-md file:border-0 file:bg-red-500 file:px-4 file:py-2 file:text-white file:cursor-pointer hover:file:bg-red-600 sm:file:mb-0 sm:file:mr-4 sm:file:w-auto"
            disabled={isUploading}
          />

          {selectedFile && (
            <p className="mt-3 max-w-full text-sm text-gray-700 dark:text-gray-200 [overflow-wrap:anywhere]">
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

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              onClick={closeUploadModal}
              variant="outline"
              disabled={isUploading}
              className="w-full text-gray-900 dark:text-white sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={isUploading || !selectedFile}
              className="w-full bg-primary text-primary-foreground gap-2 hover:bg-primary/90 sm:w-auto"
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
        className="mx-4 w-[calc(100%-2rem)] max-w-xl"
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        showCloseButton={false}
      >
        <div className="p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Delete Video
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Are you sure you want to delete{" "}
            <span className="font-medium [overflow-wrap:anywhere]">
              {videoToDelete?.file_name || "this video"}
            </span>
            ? This action cannot be undone.
          </p>

          {deleteError && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">
              {deleteError}
            </p>
          )}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              onClick={closeDeleteModal}
              variant="outline"
              disabled={isDeleting}
              className="w-full text-gray-900 dark:text-white sm:w-auto"
            >
              Cancel
            </Button>
            <button
              type="button"
              onClick={handleDeleteVideo}
              disabled={isDeleting || !videoToDelete}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
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
