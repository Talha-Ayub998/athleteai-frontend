import { useCallback, useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Maximize,
  Minimize,
} from "lucide-react";
import { useVideoPlayer } from "../hooks/useVideoPlayer";
import { useVideoKeyboard } from "../hooks/useVideoKeyboard";
import {
  VideoPlayerFeedback,
  type FeedbackState,
  type FeedbackType,
} from "./VideoPlayerFeedback";
import { VideoPlayerSettings } from "./VideoPlayerSettings";
import { Button } from "./ui/Button";
import { Slider } from "./ui/Slider";

interface VideoPlayerProps {
  src?: string;
  onTimeUpdate?: (time: number) => void;
  onDurationChange?: (duration: number) => void;
  pauseWhenModalOpen?: boolean;
}

export function VideoPlayer({
  src,
  onTimeUpdate,
  onDurationChange,
  pauseWhenModalOpen = false,
}: VideoPlayerProps) {
  const {
    videoRef,
    isPlaying,
    isBuffering,
    currentTime,
    duration,
    volume,
    isMuted,
    progress,
    bufferedRanges,
    playbackRate,
    togglePlay,
    seek,
    seekByPercent,
    setVolume,
    toggleMute,
    skipForward,
    skipBackward,
    formatTime,
    setPlaybackRate,
  } = useVideoPlayer();

  const [isHovering, setIsHovering] = useState(false);
  const [mobileControlsVisible, setMobileControlsVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [dragProgress, setDragProgress] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const lastPointerTypeRef = useRef<string>("mouse");
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const showMobileControls = () => {
    setMobileControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(
      () => setMobileControlsVisible(false),
      3000,
    );
  };

  const resetInactivityTimer = () => {
    setIsHovering(true);
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => setIsHovering(false), 2000);
  };

  const showFeedback = useCallback(
    (type: FeedbackType, value?: number) => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      setFeedback({ type, value, id: Date.now() });
      if (type === "play" || type === "pause") {
        resetInactivityTimer();
      }
      feedbackTimerRef.current = setTimeout(() => setFeedback(null), 1500);
    },
    [resetInactivityTimer],
  );

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => {
      document.removeEventListener("fullscreenchange", handler);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  const controlsVisible =
    isHovering || mobileControlsVisible || isDragging || isSettingsOpen;

  const handleVideoClick = () => {
    if (lastPointerTypeRef.current === "touch") {
      if (!mobileControlsVisible) {
        showMobileControls();
      } else {
        showFeedback(isPlaying ? "pause" : "play");
        togglePlay();
        showMobileControls();
      }
    } else {
      showFeedback(isPlaying ? "pause" : "play");
      togglePlay();
    }
  };

  useVideoKeyboard({
    videoRef,
    isPlaying,
    volume,
    currentTime,
    playbackRate,
    isMuted,
    togglePlay,
    toggleMute,
    skipBackward,
    skipForward,
    setVolume,
    seekByPercent,
    seek,
    setPlaybackRate,
    onAction: showFeedback,
  });

  useEffect(() => {
    onTimeUpdate?.(currentTime);
  }, [currentTime, onTimeUpdate]);

  useEffect(() => {
    onDurationChange?.(duration);
  }, [duration, onDurationChange]);

  useEffect(() => {
    if (!pauseWhenModalOpen) return;
    const video = videoRef.current;
    if (!video || video.paused) return;
    video.pause();
  }, [pauseWhenModalOpen, videoRef]);

  const calcProgressPercent = (clientX: number) => {
    const bar = progressBarRef.current;
    if (!bar) return 0;
    const rect = bar.getBoundingClientRect();
    return Math.max(
      0,
      Math.min(100, ((clientX - rect.left) / rect.width) * 100),
    );
  };

  const handleProgressPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    setIsDragging(true);
    document.body.style.cursor = "grabbing";
    const pct = calcProgressPercent(e.clientX);
    setDragProgress(pct);
    seekByPercent(pct);
  };

  const handleProgressPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const pct = calcProgressPercent(e.clientX);
    setDragProgress(pct);
    seekByPercent(pct);
  };

  const handleProgressPointerUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    setDragProgress(null);
    document.body.style.cursor = "";
  };

  const handleFullscreen = () => {
    const container = videoRef.current?.parentElement;
    if (!container) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
      return;
    }

    container.requestFullscreen();
  };

  const videoSrc = src || "/videos/fight-analysis.mp4";

  return (
    <div
      className="video-container relative aspect-video bg-player rounded-lg overflow-hidden group animate-lift-in"
      onMouseEnter={resetInactivityTimer}
      onMouseMove={resetInactivityTimer}
      onMouseLeave={() => {
        if (inactivityTimerRef.current)
          clearTimeout(inactivityTimerRef.current);
        setIsHovering(false);
      }}
      onPointerDown={(e) => {
        lastPointerTypeRef.current = e.pointerType;
      }}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain bg-black"
        src={videoSrc}
        onClick={handleVideoClick}
      />

      <VideoPlayerFeedback feedback={feedback} isBuffering={isBuffering} />

      <div
        className={`video-controls p-2 sm:px-6 sm:py-4 transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div
          ref={progressBarRef}
          className={`relative mb-2 sm:mb-3 group/progress h-5 flex items-center touch-none select-none cursor-pointer`}
          onPointerDown={handleProgressPointerDown}
          onPointerMove={handleProgressPointerMove}
          onPointerUp={handleProgressPointerUp}
        >
          {/* Visual track — overflow-hidden clips buffered/fill bars */}
          <div className="w-full h-1 group-hover/progress:h-1.5 transition-all rounded-full overflow-hidden relative bg-white/20">
            {bufferedRanges.map((range, index) => (
              <div
                key={`${range.startPercent}-${range.endPercent}-${index}`}
                className="absolute top-0 h-full bg-white/30"
                style={{
                  left: `${range.startPercent}%`,
                  width: `${Math.max(range.endPercent - range.startPercent, 0)}%`,
                }}
              />
            ))}
            <div
              className="absolute inset-y-0 left-0 bg-primary rounded-full"
              style={{ width: `${dragProgress ?? progress}%` }}
            />
          </div>

          {/* Thumb — always visible, grows on hover/drag */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 bg-primary rounded-full shadow-md pointer-events-none ${
              isDragging
                ? "w-4 h-4"
                : "w-3 h-3 group-hover/progress:w-4 group-hover/progress:h-4 transition-all duration-150"
            }`}
            style={{ left: `${dragProgress ?? progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-4 ">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => skipBackward(10)}
              className="text-foreground hover:bg-secondary/50 h-8 w-8"
            >
              <SkipBack className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlay}
              className="text-foreground hover:bg-secondary/50 h-8 w-8"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" fill="currentColor" />
              ) : (
                <Play className="w-4 h-4" fill="currentColor" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => skipForward(10)}
              className="text-foreground hover:bg-secondary/50 h-8 w-8"
            >
              <SkipForward className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-2 group/volume">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="text-foreground hover:bg-secondary/50 h-8 w-8"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>

              <div className="w-20 opacity-0 group-hover/volume:opacity-100 transition-opacity">
                <Slider
                  value={[isMuted ? 0 : volume * 100]}
                  max={100}
                  step={1}
                  onValueChange={([value]) => setVolume(value / 100)}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-foreground/80">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <VideoPlayerSettings
              playbackRate={playbackRate}
              setPlaybackRate={setPlaybackRate}
              onOpenChange={setIsSettingsOpen}
            />

            <Button
              variant="ghost"
              size="icon"
              onClick={handleFullscreen}
              className="text-foreground hover:bg-secondary/50 h-8 w-8"
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
