import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type RefObject,
} from "react";

interface BufferedRangeSegment {
  startPercent: number;
  endPercent: number;
}

interface UseVideoPlayerReturn {
  videoRef: RefObject<HTMLVideoElement | null>;
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  progress: number;
  bufferedRanges: BufferedRangeSegment[];
  togglePlay: () => void;
  seek: (time: number) => void;
  seekByPercent: (percent: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  skipForward: (seconds?: number) => void;
  skipBackward: (seconds?: number) => void;
  getCurrentTimestamp: () => number;
  formatTime: (seconds: number) => string;
}

export function useVideoPlayer(): UseVideoPlayerReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [bufferedRanges, setBufferedRanges] = useState<BufferedRangeSegment[]>(
    [],
  );

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const isTimeBuffered = useCallback(
    (video: HTMLVideoElement, time: number) => {
      const ranges = video.buffered;
      for (let index = 0; index < ranges.length; index += 1) {
        if (time >= ranges.start(index) && time <= ranges.end(index)) {
          return true;
        }
      }
      return false;
    },
    [],
  );

  const updateBufferedRanges = useCallback((video: HTMLVideoElement) => {
    if (!video.duration || Number.isNaN(video.duration)) {
      setBufferedRanges([]);
      return;
    }

    const ranges = video.buffered;
    const segments: BufferedRangeSegment[] = [];
    for (let index = 0; index < ranges.length; index += 1) {
      const startPercent = Math.max(
        0,
        Math.min(100, (ranges.start(index) / video.duration) * 100),
      );
      const endPercent = Math.max(
        0,
        Math.min(100, (ranges.end(index) / video.duration) * 100),
      );
      if (endPercent > startPercent) {
        segments.push({ startPercent, endPercent });
      }
    }

    setBufferedRanges(segments);
  }, []);

  const formatTime = useCallback((seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      void video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const seek = useCallback(
    (time: number) => {
      const video = videoRef.current;
      if (!video) return;

      const nextTime = Math.max(0, Math.min(time, video.duration || 0));
      setIsBuffering(!isTimeBuffered(video, nextTime));
      video.currentTime = nextTime;
    },
    [isTimeBuffered],
  );

  const seekByPercent = useCallback(
    (percent: number) => {
      const video = videoRef.current;
      if (!video || !video.duration) return;

      const nextTime = (percent / 100) * video.duration;
      setIsBuffering(!isTimeBuffered(video, nextTime));
      video.currentTime = nextTime;
    },
    [isTimeBuffered],
  );

  const setVolume = useCallback(
    (newVolume: number) => {
      const video = videoRef.current;
      if (!video) return;

      const clampedVolume = Math.max(0, Math.min(1, newVolume));
      video.volume = clampedVolume;
      setVolumeState(clampedVolume);
      if (clampedVolume > 0 && isMuted) {
        setIsMuted(false);
        video.muted = false;
      }
    },
    [isMuted],
  );

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const skipForward = useCallback((seconds = 5) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = Math.min(
      video.currentTime + seconds,
      video.duration || 0,
    );
  }, []);

  const skipBackward = useCallback((seconds = 5) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = Math.max(video.currentTime - seconds, 0);
  }, []);

  const getCurrentTimestamp = useCallback((): number => {
    return videoRef.current?.currentTime || 0;
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      updateBufferedRanges(video);
    };
    const handleDurationChange = () => {
      setDuration(video.duration);
      updateBufferedRanges(video);
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => {
      setVolumeState(video.volume);
      setIsMuted(video.muted);
    };
    const handleProgress = () => {
      updateBufferedRanges(video);
    };
    const handleWaiting = () => {
      setIsBuffering(true);
    };
    const handleCanPlay = () => {
      setIsBuffering(false);
      updateBufferedRanges(video);
    };
    const handleSeeking = () => {
      setIsBuffering(!isTimeBuffered(video, video.currentTime));
    };
    const handlePlaying = () => {
      setIsBuffering(false);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("progress", handleProgress);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("seeking", handleSeeking);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("loadedmetadata", handleDurationChange);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("volumechange", handleVolumeChange);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("progress", handleProgress);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("seeking", handleSeeking);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("loadedmetadata", handleDurationChange);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("volumechange", handleVolumeChange);
    };
  }, [isTimeBuffered, updateBufferedRanges]);

  return {
    videoRef,
    isPlaying,
    isBuffering,
    currentTime,
    duration,
    volume,
    isMuted,
    progress,
    bufferedRanges,
    togglePlay,
    seek,
    seekByPercent,
    setVolume,
    toggleMute,
    skipForward,
    skipBackward,
    getCurrentTimestamp,
    formatTime,
  };
}
