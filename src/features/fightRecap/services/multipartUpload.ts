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

export interface UploadOptions {
  concurrency?: number;
  onUploadStarted?: (upload_id: string, s3_key: string) => void;
  onProgress?: (completedParts: number, totalParts: number) => void;
  onPartComplete?: (part: Part) => void;
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

async function uploadPartToS3(uploadUrl: string, chunk: Blob): Promise<string> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    body: chunk,
  });

  if (!response.ok) {
    throw new Error(
      `S3 rejected part upload: ${response.status} ${response.statusText}`,
    );
  }

  const etag = response.headers.get("ETag");
  if (!etag) {
    throw new Error("S3 did not return an ETag for the uploaded part.");
  }

  return etag;
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

// ─── Worker pool ──────────────────────────────────────────────────────────────
// Keeps `concurrency` upload slots busy at all times.
// Workers share a counter — JS single-thread guarantees the ++ is atomic.

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

// ─── Single part orchestration ────────────────────────────────────────────────
// Slices the file, fetches the signed URL, uploads to S3, fires the callback.

async function uploadSinglePart(
  partNumber: number,
  file: File,
  upload_id: string,
  s3_key: string,
  partSizeBytes: number,
): Promise<Part> {
  const start = (partNumber - 1) * partSizeBytes;
  const end = Math.min(start + partSizeBytes, file.size);
  const chunk = file.slice(start, end);

  const uploadUrl = await getPartUrl(upload_id, s3_key, partNumber);
  const etag = await uploadPartToS3(uploadUrl, chunk);

  return { part_number: partNumber, etag };
}

// ─── Main orchestrator ────────────────────────────────────────────────────────
// Returns upload_id and s3_key alongside the result so the hook can store
// them for the cancel/abort flow and resume support.

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
    onUploadStarted,
    onProgress,
    onPartComplete,
    cancelledRef = { current: false },
  } = options;

  // Step 1 — start the multipart upload, get upload_id + s3_key
  const { upload_id, s3_key, total_parts, part_size_bytes } =
    await startUpload(file);

  onUploadStarted?.(upload_id, s3_key);

  let completedCount = 0;

  const uploadFn = async (partNumber: number): Promise<Part> => {
    const part = await uploadSinglePart(
      partNumber,
      file,
      upload_id,
      s3_key,
      part_size_bytes,
    );
    completedCount++;
    onProgress?.(completedCount, total_parts);
    onPartComplete?.(part);
    return part;
  };

  try {
    // Steps 2 & 3 — get signed URL + PUT to S3 for each chunk, 3 at a time
    const parts = await uploadWithConcurrency(
      total_parts,
      uploadFn,
      concurrency,
      cancelledRef,
    );

    if (cancelledRef.current) {
      // Workers exited cleanly due to cancel — hook is responsible for calling
      // abortUpload since it holds upload_id/s3_key in state for resume support.
      throw new UploadCancelledError();
    }

    // Step 4 — tell the backend all parts are done
    const completeResponse = await completeUpload(
      upload_id,
      s3_key,
      file,
      parts,
    );

    return { completeResponse, upload_id, s3_key };
  } catch (error) {
    if (error instanceof UploadCancelledError) {
      throw error; // let the hook handle abort
    }
    // Genuine failure — abort to avoid orphaned chunks sitting on S3
    await abortUpload(upload_id, s3_key).catch(() => {
      // best-effort, don't mask the original error
    });
    throw error;
  }
}
