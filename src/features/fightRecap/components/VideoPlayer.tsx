import { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Maximize,
  Loader2,
} from "lucide-react";
import { useVideoPlayer } from "../hooks/useVideoPlayer";
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
    togglePlay,
    seekByPercent,
    setVolume,
    toggleMute,
    skipForward,
    skipBackward,
    formatTime,
  } = useVideoPlayer();

  const [isHovering, setIsHovering] = useState(false);
  const [mobileControlsVisible, setMobileControlsVisible] = useState(false);
  const lastPointerTypeRef = useRef<string>("mouse");
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, []);

  const controlsVisible = isHovering || mobileControlsVisible || !isPlaying;

  const handleVideoClick = () => {
    if (lastPointerTypeRef.current === "touch") {
      if (!mobileControlsVisible) {
        showMobileControls();
      } else {
        togglePlay();
        showMobileControls();
      }
    } else {
      togglePlay();
    }
  };

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

  const handleProgressClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const percent = ((event.clientX - rect.left) / rect.width) * 100;
    seekByPercent(percent);
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

      {(controlsVisible || isBuffering) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity pointer-events-none">
          <div
            className="w-20 h-20 cursor-pointer rounded-full bg-primary flex items-center justify-center shadow-lg hover:scale-105 transition-transform pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation();
              if (!isBuffering) togglePlay();
              showMobileControls();
            }}
          >
            {isBuffering ? (
              <Loader2 className="w-8 h-8 text-primary-foreground animate-spin" />
            ) : isPlaying ? (
              <Pause
                className="w-8 h-8 text-primary-foreground"
                fill="currentColor"
              />
            ) : (
              <Play
                className="w-8 h-8 text-primary-foreground ml-1"
                fill="currentColor"
              />
            )}
          </div>
        </div>
      )}

      <div
        className={`video-controls p-2 sm:px-6 sm:py-4 transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div
          className="progress-bar relative mb-2 sm:mb-3 group/progress cursor-pointer h-2 hover:h-3 transition-all"
          onClick={handleProgressClick}
        >
          <div className="absolute inset-0 overflow-hidden rounded-full">
            {bufferedRanges.map((range, index) => (
              <div
                key={`${range.startPercent}-${range.endPercent}-${index}`}
                className="absolute top-0 h-full bg-secondary/80"
                style={{
                  left: `${range.startPercent}%`,
                  width: `${Math.max(range.endPercent - range.startPercent, 0)}%`,
                }}
              />
            ))}
          </div>

          <div
            className="progress-bar-fill relative z-10"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-md" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 ">
          <div className="flex items-center gap-2">
            {/* <Button
              variant="ghost"
              size="icon"
              onClick={() => skipBackward(5)}
              className="text-foreground hover:bg-secondary/50 h-8 w-8"
            >
              <SkipBack className="w-4 h-4" />
            </Button> */}

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

            {/* <Button
              variant="ghost"
              size="icon"
              onClick={() => skipForward(5)}
              className="text-foreground hover:bg-secondary/50 h-8 w-8"
            >
              <SkipForward className="w-4 h-4" />
            </Button> */}

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
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFullscreen}
              className="text-foreground hover:bg-secondary/50 h-8 w-8"
            >
              <Maximize className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
