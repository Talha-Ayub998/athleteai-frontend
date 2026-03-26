import { useEffect, useRef, useState } from "react";
import {
  abortUpload,
  CompleteUploadResponse,
  Part,
  runMultipartUpload,
  UploadCancelledError,
} from "../services/multipartUpload";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PendingUploadStorage {
  upload_id: string;
  s3_key: string;
  file_name: string;
  file_size_bytes: number;
  completed_parts: Part[];
}

const STORAGE_KEY = "athleteai_pending_upload";

const getErrorMessage = (error: unknown, fallback: string): string => {
  const e = error as {
    response?: { data?: { message?: string; detail?: string } };
    message?: string;
  };
  return (
    e?.response?.data?.message ||
    e?.response?.data?.detail ||
    e?.message ||
    fallback
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMultipartUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [partsProgress, setPartsProgress] = useState<{
    completed: number;
    total: number;
  }>({ completed: 0, total: 0 });
  const [uploadError, setUploadError] = useState("");
  const [uploadResult, setUploadResult] =
    useState<CompleteUploadResponse | null>(null);
  const [pendingResume, setPendingResume] =
    useState<PendingUploadStorage | null>(null);

  // cancelledRef is passed directly into the worker pool — setting .current
  // stops workers from claiming new parts without interrupting in-flight ones.
  const cancelledRef = useRef(false);

  // Stores upload_id + s3_key as soon as /start/ succeeds so cancel() can
  // call abortUpload even before runMultipartUpload returns.
  const abortInfoRef = useRef<{ upload_id: string; s3_key: string } | null>(
    null,
  );

  // Check for an incomplete upload left behind by a previous session
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      setPendingResume(JSON.parse(stored) as PendingUploadStorage);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const upload = async (file: File) => {
    cancelledRef.current = false;
    abortInfoRef.current = null;

    setIsUploading(true);
    setUploadProgress(0);
    setPartsProgress({ completed: 0, total: 0 });
    setUploadError("");
    setUploadResult(null);

    try {
      const result = await runMultipartUpload(file, {
        concurrency: 3,
        cancelledRef,
        onUploadStarted: (upload_id, s3_key) => {
          abortInfoRef.current = { upload_id, s3_key };
          const pending: PendingUploadStorage = {
            upload_id,
            s3_key,
            file_name: file.name,
            file_size_bytes: file.size,
            completed_parts: [],
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
          setPendingResume(pending);
        },
        onProgress: (completed, total) => {
          setPartsProgress({ completed, total });
          setUploadProgress(Math.round((completed / total) * 100));
        },
        onPartComplete: (part) => {
          // Keep localStorage in sync so resume has accurate completed parts
          const stored = localStorage.getItem(STORAGE_KEY);
          if (!stored) return;
          try {
            const pending = JSON.parse(stored) as PendingUploadStorage;
            pending.completed_parts.push(part);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
          } catch {
            // ignore storage errors — upload continues regardless
          }
        },
      });

      localStorage.removeItem(STORAGE_KEY);
      setPendingResume(null);
      setUploadResult(result.completeResponse);
    } catch (error) {
      if (error instanceof UploadCancelledError) {
        // User cancelled — abort the S3 multipart upload to clean up orphaned chunks
        if (abortInfoRef.current) {
          await abortUpload(
            abortInfoRef.current.upload_id,
            abortInfoRef.current.s3_key,
          ).catch(() => {});
        }
        localStorage.removeItem(STORAGE_KEY);
        setPendingResume(null);
        setUploadProgress(0);
        setPartsProgress({ completed: 0, total: 0 });
      } else {
        // Genuine failure — runMultipartUpload already called abortUpload
        localStorage.removeItem(STORAGE_KEY);
        setPendingResume(null);
        setUploadError(
          getErrorMessage(error, "Upload failed. Please try again."),
        );
      }
    } finally {
      setIsUploading(false);
      abortInfoRef.current = null;
    }
  };

  // Signals the worker pool to stop claiming new parts. In-flight chunks
  // finish naturally, then runMultipartUpload throws UploadCancelledError,
  // which the catch block above handles by calling abortUpload.
  const cancel = () => {
    cancelledRef.current = true;
  };

  // Discards a pending resume — aborts the incomplete S3 upload and clears
  // localStorage so the user can start fresh.
  const clearResume = async () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const pending = JSON.parse(stored) as PendingUploadStorage;
        await abortUpload(pending.upload_id, pending.s3_key).catch(() => {});
      } catch {
        // ignore parse errors
      }
    }
    localStorage.removeItem(STORAGE_KEY);
    setPendingResume(null);
  };

  const resetUploadResult = () => {
    setUploadResult(null);
    setUploadError("");
    setUploadProgress(0);
    setPartsProgress({ completed: 0, total: 0 });
  };

  return {
    isUploading,
    uploadProgress,
    partsProgress,
    uploadError,
    uploadResult,
    pendingResume,
    upload,
    cancel,
    clearResume,
    resetUploadResult,
  };
}
