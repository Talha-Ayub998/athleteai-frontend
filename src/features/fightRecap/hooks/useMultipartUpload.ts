import { useEffect, useRef, useState } from "react";
import {
  abortUpload,
  CompleteUploadResponse,
  Part,
  PendingUploadStorage,
  resumeMultipartUpload,
  runMultipartUpload,
  UploadCancelledError,
} from "../services/multipartUpload";

export type { PendingUploadStorage };

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

// ─── Shared helpers ───────────────────────────────────────────────────────────

const readStorage = (): PendingUploadStorage | null => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as PendingUploadStorage;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

const appendPartToStorage = (part: Part) => {
  const pending = readStorage();
  if (!pending) return;
  if (pending.completed_parts.some((p) => p.part_number === part.part_number))
    return;
  pending.completed_parts.push(part);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMultipartUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0); // bytes per second
  const [partsProgress, setPartsProgress] = useState<{
    completed: number;
    total: number;
  }>({ completed: 0, total: 0 });
  const [uploadError, setUploadError] = useState("");
  const [uploadResult, setUploadResult] =
    useState<CompleteUploadResponse | null>(null);
  const [pendingResume, setPendingResume] =
    useState<PendingUploadStorage | null>(null);
  const [retryingPart, setRetryingPart] = useState<{
    partNumber: number;
    attempt: number;
    maxAttempts: number;
  } | null>(null);

  // Each upload/resume creates a fresh token object and stores it here.
  // Old workers sleeping in the backoff-retry loop hold a reference to their
  // own (previous) token object, so swapping in a new token for the next
  // session doesn't accidentally reset their cancelled flag to false.
  const activeTokenRef = useRef<{ current: boolean }>({ current: false });

  // Tracks the last bytes/timestamp sample for computing upload speed
  const lastSpeedSampleRef = useRef<{ bytes: number; time: number } | null>(
    null,
  );
  // Throttle speed UI updates to once per 800ms
  const lastSpeedUpdateRef = useRef<number>(0);
  const SPEED_THROTTLE_MS = 800;

  // Stores upload_id + s3_key as soon as /start/ succeeds so cancel() can
  // call abortUpload even before runMultipartUpload returns.
  const abortInfoRef = useRef<{ upload_id: string; s3_key: string } | null>(
    null,
  );

  // Check for an incomplete upload left behind by a previous session
  useEffect(() => {
    const pending = readStorage();
    if (pending) setPendingResume(pending);
  }, []);

  // ── Shared progress/part callbacks ──────────────────────────────────────────

  const makeProgressCallbacks = (initialCompleted = 0) => ({
    onProgress: (completed: number, total: number) => {
      setPartsProgress({ completed, total });
      setRetryingPart(null); // part succeeded — clear any retry indicator
    },
    onBytesProgress: (loaded: number, total: number) => {
      setUploadProgress(Math.min(100, Math.round((loaded / total) * 100)));
      const now = Date.now();
      const last = lastSpeedSampleRef.current;
      if (last) {
        const deltaMs = now - last.time;
        const deltaBytes = loaded - last.bytes;
        if (deltaMs > 0 && deltaBytes >= 0) {
          const speed = Math.round((deltaBytes / deltaMs) * 1000);
          if (now - lastSpeedUpdateRef.current >= SPEED_THROTTLE_MS) {
            setUploadSpeed(speed);
            lastSpeedUpdateRef.current = now;
          }
        }
      }
      lastSpeedSampleRef.current = { bytes: loaded, time: now };
    },
    onPartComplete: (part: Part) => {
      appendPartToStorage(part);
    },
    onPartRetry: (partNumber: number, attempt: number, maxAttempts: number) => {
      setRetryingPart({ partNumber, attempt, maxAttempts });
    },
    _initialCompleted: initialCompleted,
  });

  // ── Shared success/error/cancel handling ─────────────────────────────────────

  const handleSuccess = (completeResponse: CompleteUploadResponse) => {
    localStorage.removeItem(STORAGE_KEY);
    setPendingResume(null);
    setRetryingPart(null);
    setUploadSpeed(0);
    lastSpeedSampleRef.current = null;
    setUploadResult(completeResponse);
  };

  const handleCancel = async () => {
    if (abortInfoRef.current) {
      await abortUpload(
        abortInfoRef.current.upload_id,
        abortInfoRef.current.s3_key,
      ).catch(() => {});
    }
    localStorage.removeItem(STORAGE_KEY);
    setPendingResume(null);
    setRetryingPart(null);
    setUploadProgress(0);
    setUploadSpeed(0);
    lastSpeedSampleRef.current = null;
    setPartsProgress({ completed: 0, total: 0 });
    setIsCancelling(false);
  };

  const handleError = (error: unknown) => {
    // runMultipartUpload/resumeMultipartUpload already called abortUpload
    localStorage.removeItem(STORAGE_KEY);
    setPendingResume(null);
    setRetryingPart(null);
    setUploadSpeed(0);
    lastSpeedSampleRef.current = null;
    setUploadError(getErrorMessage(error, "Upload failed. Please try again."));
  };

  // ── upload ───────────────────────────────────────────────────────────────────

  const upload = async (file: File) => {
    const sessionToken = { current: false };
    activeTokenRef.current = sessionToken;
    abortInfoRef.current = null;

    setIsUploading(true);
    setUploadProgress(0);
    setPartsProgress({ completed: 0, total: 0 });
    setUploadError("");
    setUploadResult(null);

    try {
      const result = await runMultipartUpload(file, {
        concurrency: 3,
        cancelledRef: sessionToken,
        onUploadStarted: (upload_id, s3_key, total_parts, part_size_bytes) => {
          abortInfoRef.current = { upload_id, s3_key };
          const pending: PendingUploadStorage = {
            upload_id,
            s3_key,
            file_name: file.name,
            file_size_bytes: file.size,
            total_parts,
            part_size_bytes,
            completed_parts: [],
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
          setPendingResume(pending);
        },
        ...makeProgressCallbacks(),
      });

      handleSuccess(result.completeResponse);
    } catch (error) {
      if (error instanceof UploadCancelledError) {
        await handleCancel();
      } else {
        handleError(error);
      }
    } finally {
      setIsUploading(false);
      abortInfoRef.current = null;
    }
  };

  // ── resume ───────────────────────────────────────────────────────────────────

  const resume = async (file: File) => {
    if (!pendingResume) return;

    const sessionToken = { current: false };
    activeTokenRef.current = sessionToken;
    abortInfoRef.current = {
      upload_id: pendingResume.upload_id,
      s3_key: pendingResume.s3_key,
    };

    // Show progress starting from already-completed parts
    const initialCompleted = pendingResume.completed_parts.length;
    const initialBytes = pendingResume.completed_parts.reduce((acc, p) => {
      return (
        acc +
        Math.min(
          pendingResume.part_size_bytes,
          pendingResume.file_size_bytes -
            (p.part_number - 1) * pendingResume.part_size_bytes,
        )
      );
    }, 0);
    setIsUploading(true);
    setUploadProgress(
      Math.round((initialBytes / pendingResume.file_size_bytes) * 100),
    );
    setPartsProgress({
      completed: initialCompleted,
      total: pendingResume.total_parts,
    });
    setUploadError("");
    setUploadResult(null);

    try {
      const result = await resumeMultipartUpload(file, pendingResume, {
        concurrency: 3,
        cancelledRef: sessionToken,
        ...makeProgressCallbacks(initialCompleted),
      });

      handleSuccess(result.completeResponse);
    } catch (error) {
      if (error instanceof UploadCancelledError) {
        await handleCancel();
      } else {
        handleError(error);
      }
    } finally {
      setIsUploading(false);
      abortInfoRef.current = null;
    }
  };

  // ── cancel ───────────────────────────────────────────────────────────────────

  const cancel = () => {
    setIsCancelling(true);
    activeTokenRef.current.current = true;
    if (abortInfoRef.current) {
      const { upload_id, s3_key } = abortInfoRef.current;
      abortInfoRef.current = null; // prevent double-abort in handleCancel
      void abortUpload(upload_id, s3_key).catch(() => {});
    }
  };

  // ── clearResume ───────────────────────────────────────────────────────────────

  const clearResume = async () => {
    const pending = readStorage();
    if (pending) {
      await abortUpload(pending.upload_id, pending.s3_key).catch(() => {});
    }
    localStorage.removeItem(STORAGE_KEY);
    setPendingResume(null);
  };

  // ── resetUploadResult ─────────────────────────────────────────────────────────

  const resetUploadResult = () => {
    setUploadResult(null);
    setUploadError("");
    setUploadProgress(0);
    setPartsProgress({ completed: 0, total: 0 });
  };

  return {
    isUploading,
    isCancelling,
    uploadProgress,
    uploadSpeed,
    partsProgress,
    retryingPart,
    uploadError,
    uploadResult,
    pendingResume,
    upload,
    resume,
    cancel,
    clearResume,
    resetUploadResult,
  };
}
