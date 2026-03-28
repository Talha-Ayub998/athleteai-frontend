import { useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeftFromLine,
  CheckCircle2,
  Eye,
  FileVideo,
  Loader2,
  PencilLine,
  Upload,
  X,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Modal } from "../../../components/ui/modal";
import { useFightRecapVideos } from "../context/FightRecapVideosContext";
import { useUpload } from "../context/UploadContext";

const formatFileSize = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** unitIndex;
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const formatSpeed = (bytesPerSecond: number) => {
  if (!bytesPerSecond) return null;
  const units = ["B/s", "KB/s", "MB/s", "GB/s"];
  const unitIndex = Math.min(
    Math.floor(Math.log(bytesPerSecond) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytesPerSecond / 1024 ** unitIndex;
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

export default function UploadVideoPage() {
  const navigate = useNavigate();
  const { createSessionForVideo } = useFightRecapVideos();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeFileError, setResumeFileError] = useState("");
  const [creatingSession, setCreatingSession] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const {
    isUploading,
    isCancelling,
    uploadProgress,
    uploadSpeed,
    uploadError,
    uploadResult,
    pendingResume,
    upload,
    resume,
    cancel,
    clearResume,
    resetUploadResult,
  } = useUpload();

  // Reset success state when user navigates away after a successful upload
  // so the upload form is fresh on next visit.
  const uploadResultRef = useRef(uploadResult);
  uploadResultRef.current = uploadResult;
  useEffect(() => {
    return () => {
      if (uploadResultRef.current) resetUploadResult();
    };
  }, [resetUploadResult]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "video/*": [] },
    maxFiles: 1,
    disabled: isUploading,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles[0]) {
        setSelectedFile(acceptedFiles[0]);
        setFileError("");
      }
    },
    onDropRejected: (rejections) => {
      const code = rejections[0]?.errors[0]?.code;
      setFileError(
        code === "file-invalid-type"
          ? "Only video files are accepted."
          : (rejections[0]?.errors[0]?.message ?? "File was rejected."),
      );
      setSelectedFile(null);
    },
  });

  const handleResumeFileSelect = (file: File) => {
    if (
      file.name !== pendingResume?.file_name ||
      file.size !== pendingResume?.file_size_bytes
    ) {
      setResumeFileError(
        `Please select the original file "${pendingResume?.file_name}" to resume.`,
      );
      setResumeFile(null);
      return;
    }
    setResumeFileError("");
    setResumeFile(file);
  };

  const handleUpload = () => {
    if (!selectedFile) {
      setFileError("Please select a video file before uploading.");
      return;
    }
    setFileError("");
    void upload(selectedFile);
  };

  const handleAnnotate = async () => {
    if (!uploadResult) return;
    const hasSession =
      uploadResult.session_id !== null && uploadResult.session_id !== undefined;

    setCreatingSession(true);
    setSessionError("");
    try {
      if (!hasSession) {
        await createSessionForVideo(uploadResult.id);
      }
      navigate(`../annotate/${uploadResult.id}`);
    } catch {
      setSessionError("Failed to start annotation session. Please try again.");
    } finally {
      setCreatingSession(false);
    }
  };

  const isCompletedSession =
    uploadResult?.session_status?.trim().toLowerCase() === "completed";
  const hasSession =
    uploadResult?.session_id !== null && uploadResult?.session_id !== undefined;
  const annotationLabel = isCompletedSession
    ? "View Annotation"
    : hasSession
      ? "Continue Annotation"
      : "Start Annotation";
  const AnnotationIcon = isCompletedSession ? Eye : PencilLine;

  return (
    <div className="fight-recap-screen min-h-screen bg-background">
      <main className="overflow-y-auto px-4 py-5 sm:p-6">
        <div className="mx-auto max-w-2xl animate-lift-in space-y-6">
          {/* Header */}
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold text-foreground sm:gap-3 sm:text-2xl">
              <Upload className="h-6 w-6 text-primary sm:h-7 sm:w-7" />
              Upload Video
            </h1>
            <p className="mt-1 text-muted-foreground">
              Upload your fight video to start annotation.
            </p>
          </div>

          {uploadResult ? (
            // ── Success state ──────────────────────────────────────────────
            <div className="rounded-lg border border-border bg-card p-6 space-y-6">
              <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-4 text-green-800 dark:text-green-200">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium">{uploadResult.message}</p>
                    <p className="mt-1 text-sm [overflow-wrap:anywhere]">
                      {uploadResult.file_name || "Untitled video"}
                    </p>
                    <p className="mt-1 text-sm opacity-80">
                      {formatFileSize(uploadResult.file_size_bytes)}
                    </p>
                  </div>
                </div>
              </div>

              {sessionError && (
                <p className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {sessionError}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  onClick={() => navigate("..")}
                  variant="outline"
                  disabled={creatingSession}
                  className="w-full text-foreground sm:w-auto"
                >
                  <ArrowLeftFromLine className="h-4 w-4" />
                  Back to Videos
                </Button>
                <Button
                  onClick={() => {
                    resetUploadResult();
                    setSelectedFile(null);
                  }}
                  variant="outline"
                  disabled={creatingSession}
                  className="w-full gap-2 text-foreground sm:w-auto"
                >
                  <Upload className="h-4 w-4" />
                  Upload Another
                </Button>
                <Button
                  onClick={() => void handleAnnotate()}
                  disabled={creatingSession}
                  className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
                >
                  {creatingSession ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Opening...
                    </>
                  ) : (
                    <>
                      <AnnotationIcon className="h-4 w-4" />
                      {annotationLabel}
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            // ── Upload form ────────────────────────────────────────────────
            <div className="rounded-lg border border-border bg-card p-6 space-y-5">
              {/* Pending resume banner */}
              {pendingResume && !isUploading && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-4 text-amber-800 dark:text-amber-200">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <div className="text-sm">
                        <p>
                          Incomplete upload:{" "}
                          <span className="font-medium [overflow-wrap:anywhere]">
                            {pendingResume.file_name}
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs opacity-80">
                          {/* {pendingResume.completed_parts.length} of{" "}
                          {pendingResume.total_parts} parts uploaded —{" "} */}
                          {Math.round(
                            (pendingResume.completed_parts.length /
                              pendingResume.total_parts) *
                              100,
                          )}
                          % done
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void clearResume()}
                      className="shrink-0 text-sm font-medium underline underline-offset-2"
                    >
                      Discard
                    </button>
                  </div>

                  <div className="mt-3">
                    <p className="mb-2 text-xs opacity-80">
                      Select the same file to resume where you left off:
                    </p>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleResumeFileSelect(file);
                      }}
                      className="block w-full text-sm text-amber-800 dark:text-amber-200 file:mr-3 file:rounded-md file:border-0 file:bg-amber-500/20 file:px-3 file:py-1.5 file:text-sm file:font-medium file:cursor-pointer hover:file:bg-amber-500/30"
                    />
                    {resumeFileError && (
                      <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                        {resumeFileError}
                      </p>
                    )}
                    {resumeFile && (
                      <Button
                        onClick={() => void resume(resumeFile)}
                        className="mt-3 w-full gap-2 bg-amber-600 text-white hover:bg-amber-700 sm:w-auto"
                      >
                        <Upload className="h-4 w-4" />
                        Resume Upload
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-16 text-center transition-colors
                  ${
                    isUploading
                      ? "cursor-not-allowed border-border opacity-50"
                      : isDragActive
                        ? "cursor-pointer border-primary bg-primary/5"
                        : "cursor-pointer border-border hover:border-primary/40 hover:bg-muted/20"
                  }`}
              >
                <input {...getInputProps()} />
                <Upload
                  className={`mx-auto mb-4 h-12 w-12 ${isDragActive && !isUploading ? "text-primary" : "text-muted-foreground"}`}
                />
                {isDragActive && !isUploading ? (
                  <p className="text-base font-medium text-primary">
                    Drop your video here
                  </p>
                ) : (
                  <>
                    <p className="text-base font-medium text-foreground">
                      Drag & drop your video here
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      or{" "}
                      <span className="text-primary underline underline-offset-2">
                        click to browse
                      </span>
                    </p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      MP4, MOV, AVI and other video formats supported
                    </p>
                  </>
                )}
              </div>

              {/* Selected file */}
              {selectedFile && !isUploading && (
                <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
                  <FileVideo className="h-5 w-5 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground [overflow-wrap:anywhere]">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Remove selected file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Upload progress */}
              {isUploading && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
                    <FileVideo className="h-5 w-5 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground [overflow-wrap:anywhere]">
                        {selectedFile?.name ?? pendingResume?.file_name}
                      </p>
                      <p className="text-xs text-muted-foreground pt-1">
                        {uploadSpeed > 0
                          ? `${formatSpeed(uploadSpeed)} · Uploading...`
                          : "Uploading..."}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-medium text-foreground">
                      {uploadProgress}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {(fileError || uploadError) && (
                <p className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {fileError || uploadError}
                </p>
              )}

              {/* Actions */}
              <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
                {isUploading ? (
                  <Button
                    onClick={() => setShowCancelConfirm(true)}
                    disabled={isCancelling || uploadProgress >= 100}
                    variant="outline"
                    className="w-full text-foreground sm:w-auto"
                  >
                    {isCancelling ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      "Cancel Upload"
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={() => navigate("..")}
                    variant="outline"
                    className="w-full text-foreground sm:w-auto"
                  >
                    <ArrowLeftFromLine className="w-4 h-4 " />
                    Cancel
                  </Button>
                )}
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || !selectedFile}
                  className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
                >
                  {isUploading && !isCancelling ? (
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
          )}
        </div>
      </main>

      <Modal
        className="mx-4 w-[calc(100%-2rem)] max-w-md"
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        showCloseButton={false}
      >
        <div className="p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Cancel Upload?
          </h3>
          <p className="text-sm text-muted-foreground">
            All upload progress will be lost and cannot be resumed. Are you sure
            you want to cancel?
          </p>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              onClick={() => setShowCancelConfirm(false)}
              variant="outline"
              className="w-full text-foreground sm:w-auto"
            >
              Keep Uploading
            </Button>
            <button
              type="button"
              onClick={() => {
                setShowCancelConfirm(false);
                cancel();
              }}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 sm:w-auto"
            >
              Yes, Cancel Upload
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
