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

interface FightRecapVideosContextValue {
  videos: UploadedVideo[];
  isLoading: boolean;
  fetchError: string;
  hasFetched: boolean;
  fetchVideos: (force?: boolean) => Promise<void>;
  upsertVideo: (video: UploadedVideo) => void;
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

  const value = useMemo(
    () => ({
      videos,
      isLoading,
      fetchError,
      hasFetched,
      fetchVideos,
      upsertVideo,
      removeVideo,
    }),
    [videos, isLoading, fetchError, hasFetched, fetchVideos, upsertVideo, removeVideo],
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
