import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import axiosInstance from "../../../api/axiosInstance";

export interface UploadedVideo {
  id: number;
  url: string;
  is_youtube_link: boolean;
  s3_key: string | null;
  file_name: string | null;
  content_type: string | null;
  file_size_bytes: number | null;
  file_hash: string | null;
  session_id: number | null;
  session_status: string | null;
  session_updated_at: string | null;
  playback_url: string;
  created_at: string;
}

interface UploadedVideoListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: UploadedVideo[];
}

interface FightRecapVideosContextValue {
  videos: UploadedVideo[];
  isLoading: boolean;
  fetchError: string;
  hasFetched: boolean;
  fetchVideos: (force?: boolean) => Promise<void>;
  createSessionForVideo: (videoId: number) => Promise<number>;
  upsertVideo: (video: UploadedVideo) => void;
  updateVideo: (videoId: number, updates: Partial<UploadedVideo>) => void;
  removeVideo: (videoId: number) => void;
}

const FightRecapVideosContext =
  createContext<FightRecapVideosContextValue | null>(null);

const getErrorMessage = (error: any, fallback: string) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.detail ||
    error?.message ||
    fallback
  );
};

interface AnnotationSessionResponse {
  id: number;
  video_id: number;
  status: string | null;
  updated_at: string | null;
}

export function FightRecapVideosProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [videos, setVideos] = useState<UploadedVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [hasFetched, setHasFetched] = useState(false);
  const inFlightRef = useRef<Promise<void> | null>(null);
  const inFlightSessionRequestsRef = useRef<Map<number, Promise<number>>>(
    new Map(),
  );

  const fetchVideos = useCallback(
    async (force = false) => {
      if (!force && hasFetched) return;
      if (inFlightRef.current) return inFlightRef.current;

      const request = (async () => {
        setIsLoading(true);
        setFetchError("");

        try {
          const response = await axiosInstance.get<UploadedVideoListResponse>(
            "/reports/my-video-urls/",
          );
          setVideos(response.data?.results ?? []);
          setHasFetched(true);
        } catch (error) {
          setFetchError(
            getErrorMessage(error, "Failed to fetch uploaded videos."),
          );
        } finally {
          setIsLoading(false);
          inFlightRef.current = null;
        }
      })();

      inFlightRef.current = request;
      return request;
    },
    [hasFetched],
  );

  const upsertVideo = useCallback((video: UploadedVideo) => {
    setVideos((prev) => {
      const withoutDuplicate = prev.filter((item) => item.id !== video.id);
      return [video, ...withoutDuplicate];
    });
    setHasFetched(true);
  }, []);

  const removeVideo = useCallback((videoId: number) => {
    setVideos((prev) => prev.filter((item) => item.id !== videoId));
  }, []);

  const updateVideo = useCallback(
    (videoId: number, updates: Partial<UploadedVideo>) => {
      setVideos((prev) =>
        prev.map((item) =>
          item.id === videoId ? { ...item, ...updates } : item,
        ),
      );
      setHasFetched(true);
    },
    [],
  );

  const createSessionForVideo = useCallback(
    async (videoId: number) => {
      const existingVideo = videos.find((video) => video.id === videoId);
      if (
        existingVideo?.session_id !== null &&
        existingVideo?.session_id !== undefined
      ) {
        return existingVideo.session_id;
      }

      const existingRequest = inFlightSessionRequestsRef.current.get(videoId);
      if (existingRequest) {
        return existingRequest;
      }

      const request = (async () => {
        const response = await axiosInstance.post<AnnotationSessionResponse>(
          "/reports/annotation-sessions/",
          { video_id: videoId },
        );

        const session = response.data;
        setVideos((prev) =>
          prev.map((video) =>
            video.id === session.video_id
              ? {
                  ...video,
                  session_id: session.id,
                  session_status: session.status,
                  session_updated_at: session.updated_at,
                }
              : video,
          ),
        );
        setHasFetched(true);

        return session.id;
      })();

      inFlightSessionRequestsRef.current.set(videoId, request);

      try {
        return await request;
      } finally {
        inFlightSessionRequestsRef.current.delete(videoId);
      }
    },
    [videos],
  );

  const value = useMemo(
    () => ({
      videos,
      isLoading,
      fetchError,
      hasFetched,
      fetchVideos,
      createSessionForVideo,
      upsertVideo,
      updateVideo,
      removeVideo,
    }),
    [
      videos,
      isLoading,
      fetchError,
      hasFetched,
      fetchVideos,
      createSessionForVideo,
      upsertVideo,
      updateVideo,
      removeVideo,
    ],
  );

  return (
    <FightRecapVideosContext.Provider value={value}>
      {children}
    </FightRecapVideosContext.Provider>
  );
}

export const useFightRecapVideos = () => {
  const context = useContext(FightRecapVideosContext);
  if (!context) {
    throw new Error(
      "useFightRecapVideos must be used within FightRecapVideosProvider",
    );
  }
  return context;
};
