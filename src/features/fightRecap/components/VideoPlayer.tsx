import { useEffect, useState } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Maximize,
  Plus,
  Loader2,
} from "lucide-react";
import { useVideoPlayer } from "../hooks/useVideoPlayer";
import { Button } from "./ui/Button";
import { Slider } from "./ui/Slider";

interface VideoPlayerProps {
  src?: string;
  onAddEvent?: (timestamp: number) => void;
  canAddEvent?: boolean;
  onTimeUpdate?: (time: number) => void;
  pauseWhenModalOpen?: boolean;
}

export function VideoPlayer({
  src,
  onAddEvent,
  canAddEvent = true,
  onTimeUpdate,
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
    getCurrentTimestamp,
    formatTime,
  } = useVideoPlayer();

  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    onTimeUpdate?.(currentTime);
  }, [currentTime, onTimeUpdate]);

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
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain bg-black"
        src={videoSrc}
        onClick={togglePlay}
      />

      {isBuffering && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/25 pointer-events-none">
          <div className="inline-flex items-center gap-2 rounded-full bg-black/65 text-white px-3 py-1.5 text-sm">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </div>
      )}

      {!isPlaying && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity"
        >
          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
            <Play
              className="w-8 h-8 text-primary-foreground ml-1"
              fill="currentColor"
            />
          </div>
        </button>
      )}

      <div
        className={`video-controls transition-opacity duration-300 ${
          isHovering || !isPlaying ? "opacity-100" : "opacity-0"
        }`}
      >
        <div
          className="progress-bar relative mb-3 group/progress cursor-pointer h-2 hover:h-3 transition-all"
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

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => skipBackward(5)}
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
              onClick={() => skipForward(5)}
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

            <span className="text-sm font-mono text-foreground/80 ml-2">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {canAddEvent && (
              <Button
                onClick={() => onAddEvent?.(getCurrentTimestamp())}
                className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 px-3 gap-1"
                size="sm"
              >
                <Plus className="w-4 h-4" />
                Add Event
              </Button>
            )}

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
