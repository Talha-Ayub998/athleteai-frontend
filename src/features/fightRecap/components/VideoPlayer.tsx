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
  Settings,
  Gauge,
  ChevronRight,
  ArrowLeft,
  Check,
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
    playbackRate,
    togglePlay,
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsView, setSettingsView] = useState<"main" | "playback">("main");
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState<number | null>(null);
  const lastPointerTypeRef = useRef<string>("mouse");
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isSettingsOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(e.target as Node)
      ) {
        setIsSettingsOpen(false);
        setSettingsView("main");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSettingsOpen]);

  const controlsVisible = isHovering || mobileControlsVisible || isDragging;

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
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "f" || e.key === "F") {
        const container = videoRef.current?.parentElement;
        if (!container) return;
        if (document.fullscreenElement) {
          void document.exitFullscreen();
        } else {
          void container.requestFullscreen();
        }
      } else if (e.key === "m" || e.key === "M") {
        toggleMute();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, toggleMute, videoRef]);

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

            <div ref={settingsRef} className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsSettingsOpen((prev) => {
                    if (prev) setSettingsView("main");
                    return !prev;
                  });
                }}
                className="text-foreground hover:bg-secondary/50 h-8 w-8"
              >
                <Settings
                  className={`w-4 h-4 transition-transform duration-300 ${isSettingsOpen ? "rotate-45" : "rotate-0"}`}
                />
              </Button>

              {/* Settings panel — height transitions between views, panels slide on x-axis */}
              <div
                className={`absolute bottom-full right-0 mb-2 w-60 rounded-lg bg-black/60 backdrop-blur-sm overflow-hidden transition-all duration-200 origin-bottom-right ${
                  isSettingsOpen
                    ? "opacity-100 scale-100 pointer-events-auto"
                    : "opacity-0 scale-95 pointer-events-none"
                }`}
                style={{
                  // main: py-1 (8px) + 1 row (36px) = 44px
                  // playback: py-1 (8px) + header (37px w/ border) + 8 rows (8×36px=288px) = 333px
                  height: settingsView === "main" ? "44px" : "333px",
                }}
              >
                {/* Main panel */}
                <div
                  className="absolute inset-x-0 top-0 py-1 transition-transform duration-200"
                  style={{
                    transform:
                      settingsView === "playback"
                        ? "translateX(-100%)"
                        : "translateX(0)",
                  }}
                >
                  <button
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                    onClick={() => setSettingsView("playback")}
                  >
                    <div className="flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-white/70" />
                      <span>Playback speed</span>
                    </div>
                    <div className="flex items-center gap-1 text-white/50">
                      <span className="text-xs">
                        {playbackRate === 1 ? "Normal" : `${playbackRate}x`}
                      </span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </button>
                </div>

                {/* Playback speed panel */}
                <div
                  className="absolute inset-x-0 top-0 py-1 transition-transform duration-200"
                  style={{
                    transform:
                      settingsView === "playback"
                        ? "translateX(0)"
                        : "translateX(100%)",
                  }}
                >
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors border-b border-white/5"
                    onClick={() => setSettingsView("main")}
                  >
                    <ArrowLeft className="w-4 h-4 text-white/70" />
                    <span>Playback speed</span>
                  </button>
                  {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                    <button
                      key={rate}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                      onClick={() => {
                        setPlaybackRate(rate);
                        setIsSettingsOpen(false);
                        setSettingsView("main");
                      }}
                    >
                      <span>{rate === 1 ? "Normal" : `${rate}x`}</span>
                      {rate === playbackRate && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

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
