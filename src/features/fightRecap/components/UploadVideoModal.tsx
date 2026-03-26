import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  FileVideo,
  Loader2,
  PencilLine,
  Upload,
  X,
} from "lucide-react";
import { Modal } from "../../../components/ui/modal";
import { Button } from "./ui/Button";
import { UploadedVideo } from "../context/FightRecapVideosContext";
import { useMultipartUpload } from "../hooks/useMultipartUpload";

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

interface UploadVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (video: UploadedVideo) => void;
  onAnnotate: (video: UploadedVideo) => void;
  creatingSessionVideoId: number | null;
}

export function UploadVideoModal({
  isOpen,
  onClose,
  onUploadSuccess,
  onAnnotate,
  creatingSessionVideoId,
}: UploadVideoModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeFileError, setResumeFileError] = useState("");

  const {
    isUploading,
    uploadProgress,
    uploadError,
    uploadResult,
    pendingResume,
    upload,
    resume,
    cancel,
    clearResume,
    resetUploadResult,
  } = useMultipartUpload();

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

  // Notify parent when upload completes so the video appears in the list
  useEffect(() => {
    if (uploadResult) {
      onUploadSuccess(uploadResult as UploadedVideo);
    }
  }, [uploadResult, onUploadSuccess]);

  const handleClose = () => {
    if (isUploading) return;
    resetUploadResult();
    setSelectedFile(null);
    setFileError("");
    setResumeFile(null);
    setResumeFileError("");
    onClose();
  };

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

  const isAnnotating =
    uploadResult !== null && creatingSessionVideoId === uploadResult.id;
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
    <Modal
      className="mx-4 w-[calc(100%-2rem)] max-w-xl"
      isOpen={isOpen}
      onClose={handleClose}
    >
      <div className="p-4 sm:p-6">
        <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
          {uploadResult ? "Upload Complete" : "Upload Video"}
        </h3>

        {uploadResult ? (
          // ── Success state ────────────────────────────────────────────────
          <>
            <div className="mt-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-green-800 dark:text-green-200">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{uploadResult.message}</p>
                  <p className="mt-1 text-sm [overflow-wrap:anywhere]">
                    {uploadResult.file_name || "Untitled video"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                onClick={handleClose}
                variant="outline"
                disabled={isAnnotating}
                className="w-full text-gray-900 dark:text-white sm:w-auto"
              >
                Close
              </Button>
              <Button
                onClick={() => onAnnotate(uploadResult as UploadedVideo)}
                disabled={isAnnotating}
                className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
              >
                {isAnnotating ? (
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
          </>
        ) : (
          // ── Upload form ──────────────────────────────────────────────────
          <>
            {/* Pending resume banner */}
            {pendingResume && !isUploading && (
              <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-800 dark:text-amber-200">
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
                        {pendingResume.completed_parts.length} of{" "}
                        {pendingResume.total_parts} parts uploaded
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
            {!isUploading && (
              <div
                {...getRootProps()}
                className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors
                  ${
                    isDragActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-muted/20"
                  }`}
              >
                <input {...getInputProps()} />
                <Upload
                  className={`mx-auto mb-3 h-10 w-10 ${isDragActive ? "text-primary" : "text-muted-foreground"}`}
                />
                {isDragActive ? (
                  <p className="text-sm font-medium text-primary">
                    Drop your video here
                  </p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-foreground">
                      Drag & drop your video here
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      or{" "}
                      <span className="text-primary underline underline-offset-2">
                        click to browse
                      </span>
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      MP4, MOV, AVI and other video formats supported
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Selected file info */}
            {selectedFile && !isUploading && (
              <div className="mt-3 flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
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
              <div className="mt-4">
                <div className="mb-2 flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
                  <FileVideo className="h-5 w-5 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground [overflow-wrap:anywhere]">
                      {selectedFile?.name ?? pendingResume?.file_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Uploading...
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-foreground">
                    {uploadProgress}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {(fileError || uploadError) && (
              <p className="mt-3 flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {fileError || uploadError}
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              {isUploading ? (
                <Button
                  onClick={cancel}
                  variant="outline"
                  className="w-full text-gray-900 dark:text-white sm:w-auto"
                >
                  Cancel Upload
                </Button>
              ) : (
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="w-full text-gray-900 dark:text-white sm:w-auto"
                >
                  Cancel
                </Button>
              )}
              <Button
                onClick={handleUpload}
                disabled={isUploading || !selectedFile}
                className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
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
          </>
        )}
      </div>
    </Modal>
  );
}
