import axiosInstance from "../../../api/axiosInstance";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StartUploadResponse {
  upload_id: string;
  s3_key: string;
  total_parts: number;
  part_size_bytes: number;
}

export interface Part {
  part_number: number;
  etag: string;
}

export interface CompleteUploadResponse {
  status: string;
  message: string;
  id: number;
  url: string;
  s3_key: string;
  file_name: string;
  content_type: string;
  file_size_bytes: number;
  file_hash: string | null;
  session_id: number | null;
  session_status: string | null;
  session_updated_at: string | null;
  playback_url: string;
  created_at: string;
}

// Stored in localStorage so resume can skip already-completed parts
export interface PendingUploadStorage {
  upload_id: string;
  s3_key: string;
  file_name: string;
  file_size_bytes: number;
  total_parts: number;
  part_size_bytes: number;
  completed_parts: Part[];
}

export interface UploadOptions {
  concurrency?: number;
  maxRetries?: number;
  onUploadStarted?: (
    upload_id: string,
    s3_key: string,
    total_parts: number,
    part_size_bytes: number,
  ) => void;
  onProgress?: (completedParts: number, totalParts: number) => void;
  onBytesProgress?: (loadedBytes: number, totalBytes: number) => void;
  onPartComplete?: (part: Part) => void;
  onPartRetry?: (
    partNumber: number,
    attempt: number,
    maxAttempts: number,
  ) => void;
  cancelledRef?: { current: boolean };
}

// Thrown when the upload is cancelled — lets the hook distinguish
// a deliberate cancel from a genuine network/server failure.
export class UploadCancelledError extends Error {
  constructor() {
    super("Upload was cancelled.");
    this.name = "UploadCancelledError";
  }
}

// ─── Individual API calls ─────────────────────────────────────────────────────

export async function startUpload(file: File): Promise<StartUploadResponse> {
  const response = await axiosInstance.post<StartUploadResponse>(
    "/reports/video-upload/multipart/start/",
    {
      file_name: file.name,
      content_type: file.type,
      file_size_bytes: file.size,
    },
  );
  return response.data;
}

async function getPartUrl(
  upload_id: string,
  s3_key: string,
  partNumber: number,
): Promise<string> {
  const response = await axiosInstance.post<{
    upload_url: string;
    part_number: number;
  }>("/reports/video-upload/multipart/part-url/", {
    upload_id,
    s3_key,
    part_number: partNumber,
  });
  return response.data.upload_url;
}

function uploadPartToS3(
  uploadUrl: string,
  chunk: Blob,
  onProgress?: (loaded: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);

    if (onProgress) {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) onProgress(e.loaded);
      });
    }

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const etag = xhr.getResponseHeader("ETag");
        if (!etag) {
          reject(new Error("S3 did not return an ETag for the uploaded part."));
        } else {
          resolve(etag);
        }
      } else {
        reject(
          new Error(`S3 rejected part upload: ${xhr.status} ${xhr.statusText}`),
        );
      }
    });

    xhr.addEventListener("error", () =>
      reject(new Error("Network error during part upload.")),
    );

    xhr.send(chunk);
  });
}

export async function completeUpload(
  upload_id: string,
  s3_key: string,
  file: File,
  parts: Part[],
): Promise<CompleteUploadResponse> {
  const response = await axiosInstance.post<CompleteUploadResponse>(
    "/reports/video-upload/multipart/complete/",
    {
      upload_id,
      s3_key,
      file_name: file.name,
      content_type: file.type,
      file_size_bytes: file.size,
      parts,
    },
  );
  return response.data;
}

export async function abortUpload(
  upload_id: string,
  s3_key: string,
): Promise<void> {
  await axiosInstance.post("/reports/video-upload/multipart/abort/", {
    upload_id,
    s3_key,
  });
}

// ─── Single part orchestration ────────────────────────────────────────────────

async function uploadSinglePart(
  partNumber: number,
  file: File,
  upload_id: string,
  s3_key: string,
  partSizeBytes: number,
  cancelledRef: { current: boolean },
  onPartProgress?: (loaded: number) => void,
): Promise<Part> {
  if (cancelledRef.current) throw new UploadCancelledError();

  const start = (partNumber - 1) * partSizeBytes;
  const end = Math.min(start + partSizeBytes, file.size);
  const chunk = file.slice(start, end);

  const uploadUrl = await getPartUrl(upload_id, s3_key, partNumber);

  if (cancelledRef.current) throw new UploadCancelledError();

  const etag = await uploadPartToS3(uploadUrl, chunk, onPartProgress);

  return { part_number: partNumber, etag };
}

// Retries a single part upload with exponential backoff.
// Gets a fresh signed URL on each attempt — the previous URL may be stale.
// Does NOT retry if the upload was cancelled.
async function uploadSinglePartWithRetry(
  partNumber: number,
  file: File,
  upload_id: string,
  s3_key: string,
  partSizeBytes: number,
  maxAttempts: number,
  cancelledRef: { current: boolean },
  onRetry?: (partNumber: number, attempt: number, maxAttempts: number) => void,
  onPartProgress?: (loaded: number) => void,
): Promise<Part> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await uploadSinglePart(
        partNumber,
        file,
        upload_id,
        s3_key,
        partSizeBytes,
        cancelledRef,
        onPartProgress,
      );
    } catch (error) {
      lastError = error;
      onPartProgress?.(0); // reset this part's progress on retry
      if (attempt < maxAttempts && !cancelledRef.current) {
        onRetry?.(partNumber, attempt + 1, maxAttempts);
        const delayMs = 1000 * 2 ** (attempt - 1); // 1s → 2s → 4s
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
}

// ─── Worker pools ─────────────────────────────────────────────────────────────
// Keeps `concurrency` slots busy at all times.
// Workers share a counter/index — JS single-thread guarantees atomicity.

async function uploadWithConcurrency(
  totalParts: number,
  uploadFn: (partNumber: number) => Promise<Part>,
  concurrency: number,
  cancelledRef: { current: boolean },
): Promise<Part[]> {
  const results: Part[] = new Array(totalParts);
  let nextPartNumber = 1;

  async function worker(): Promise<void> {
    while (nextPartNumber <= totalParts) {
      if (cancelledRef.current) return;
      const partNumber = nextPartNumber++;
      results[partNumber - 1] = await uploadFn(partNumber);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

// Used by resume — only uploads specific part numbers, not a full sequential range
async function uploadRemainingPartsWithConcurrency(
  remainingPartNumbers: number[],
  uploadFn: (partNumber: number) => Promise<Part>,
  concurrency: number,
  cancelledRef: { current: boolean },
): Promise<Part[]> {
  const results: Part[] = [];
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < remainingPartNumbers.length) {
      if (cancelledRef.current) return;
      const idx = nextIndex++;
      results.push(await uploadFn(remainingPartNumbers[idx]));
    }
  }

  const workerCount = Math.min(concurrency, remainingPartNumbers.length);
  if (workerCount > 0) {
    await Promise.all(Array.from({ length: workerCount }, worker));
  }

  return results;
}

// ─── Main orchestrator ────────────────────────────────────────────────────────

export interface RunMultipartUploadResult {
  completeResponse: CompleteUploadResponse;
  upload_id: string;
  s3_key: string;
}

export async function runMultipartUpload(
  file: File,
  options: UploadOptions = {},
): Promise<RunMultipartUploadResult> {
  const {
    concurrency = 3,
    maxRetries = 3,
    onUploadStarted,
    onProgress,
    onBytesProgress,
    onPartComplete,
    onPartRetry,
    cancelledRef = { current: false },
  } = options;

  const { upload_id, s3_key, total_parts, part_size_bytes } =
    await startUpload(file);

  onUploadStarted?.(upload_id, s3_key, total_parts, part_size_bytes);

  let completedCount = 0;
  let completedBytes = 0;
  const partProgress = new Map<number, number>();

  const uploadFn = async (partNumber: number): Promise<Part> => {
    const chunkSize = Math.min(
      part_size_bytes,
      file.size - (partNumber - 1) * part_size_bytes,
    );
    const part = await uploadSinglePartWithRetry(
      partNumber,
      file,
      upload_id,
      s3_key,
      part_size_bytes,
      maxRetries,
      cancelledRef,
      onPartRetry,
      onBytesProgress
        ? (loaded) => {
            partProgress.set(partNumber, loaded);
            const inFlight = Array.from(partProgress.values()).reduce(
              (a, b) => a + b,
              0,
            );
            onBytesProgress(completedBytes + inFlight, file.size);
          }
        : undefined,
    );
    completedBytes += chunkSize;
    partProgress.delete(partNumber);
    completedCount++;
    onProgress?.(completedCount, total_parts);
    onPartComplete?.(part);
    return part;
  };

  try {
    const parts = await uploadWithConcurrency(
      total_parts,
      uploadFn,
      concurrency,
      cancelledRef,
    );

    if (cancelledRef.current) {
      throw new UploadCancelledError();
    }

    const completeResponse = await completeUpload(
      upload_id,
      s3_key,
      file,
      parts,
    );

    return { completeResponse, upload_id, s3_key };
  } catch (error) {
    if (error instanceof UploadCancelledError) {
      throw error;
    }
    // Stop other workers from starting new parts before aborting the session
    cancelledRef.current = true;
    await abortUpload(upload_id, s3_key).catch(() => {});
    throw error;
  }
}

// ─── Resume orchestrator ──────────────────────────────────────────────────────
// Skips already-completed parts, uploads only the remaining ones,
// then merges all parts and calls /complete/.

export async function resumeMultipartUpload(
  file: File,
  pending: PendingUploadStorage,
  options: UploadOptions = {},
): Promise<RunMultipartUploadResult> {
  const {
    concurrency = 3,
    maxRetries = 3,
    onProgress,
    onBytesProgress,
    onPartComplete,
    onPartRetry,
    cancelledRef = { current: false },
  } = options;

  const { upload_id, s3_key, total_parts, part_size_bytes, completed_parts } =
    pending;

  const completedSet = new Set(completed_parts.map((p) => p.part_number));
  const remainingPartNumbers = Array.from(
    { length: total_parts },
    (_, i) => i + 1,
  ).filter((n) => !completedSet.has(n));

  // Start progress from already-completed parts
  let completedCount = completed_parts.length;
  let completedBytes = completed_parts.reduce((acc, p) => {
    return (
      acc +
      Math.min(
        part_size_bytes,
        file.size - (p.part_number - 1) * part_size_bytes,
      )
    );
  }, 0);
  const partProgress = new Map<number, number>();

  const uploadFn = async (partNumber: number): Promise<Part> => {
    const chunkSize = Math.min(
      part_size_bytes,
      file.size - (partNumber - 1) * part_size_bytes,
    );
    const part = await uploadSinglePartWithRetry(
      partNumber,
      file,
      upload_id,
      s3_key,
      part_size_bytes,
      maxRetries,
      cancelledRef,
      onPartRetry,
      onBytesProgress
        ? (loaded) => {
            partProgress.set(partNumber, loaded);
            const inFlight = Array.from(partProgress.values()).reduce(
              (a, b) => a + b,
              0,
            );
            onBytesProgress(completedBytes + inFlight, file.size);
          }
        : undefined,
    );
    completedBytes += chunkSize;
    partProgress.delete(partNumber);
    completedCount++;
    onProgress?.(completedCount, total_parts);
    onPartComplete?.(part);
    return part;
  };

  try {
    const newParts = await uploadRemainingPartsWithConcurrency(
      remainingPartNumbers,
      uploadFn,
      concurrency,
      cancelledRef,
    );

    if (cancelledRef.current) {
      throw new UploadCancelledError();
    }

    // Merge already-completed + newly uploaded, deduplicate by part_number
    // (keep the newest ETag — newParts wins), then sort for S3.
    const seenParts = new Set<number>();
    const allParts = [...newParts, ...completed_parts]
      .filter((p) => {
        if (seenParts.has(p.part_number)) return false;
        seenParts.add(p.part_number);
        return true;
      })
      .sort((a, b) => a.part_number - b.part_number);

    const completeResponse = await completeUpload(
      upload_id,
      s3_key,
      file,
      allParts,
    );

    return { completeResponse, upload_id, s3_key };
  } catch (error) {
    if (error instanceof UploadCancelledError) throw error;
    // Stop other workers from starting new parts before aborting the session
    cancelledRef.current = true;
    await abortUpload(upload_id, s3_key).catch(() => {});
    throw error;
  }
}
