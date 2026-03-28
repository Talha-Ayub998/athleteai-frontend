import { useEffect } from "react";
import type { RefObject } from "react";

const SPEED_STEPS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const FRAME_DURATION = 1 / 30;

interface UseVideoKeyboardOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  playbackRate: number;
  togglePlay: () => void;
  toggleMute: () => void;
  skipBackward: (seconds?: number) => void;
  skipForward: (seconds?: number) => void;
  setVolume: (volume: number) => void;
  seekByPercent: (percent: number) => void;
  seek: (time: number) => void;
  setPlaybackRate: (rate: number) => void;
}

export function useVideoKeyboard({
  videoRef,
  isPlaying,
  volume,
  currentTime,
  playbackRate,
  togglePlay,
  toggleMute,
  skipBackward,
  skipForward,
  setVolume,
  seekByPercent,
  seek,
  setPlaybackRate,
}: UseVideoKeyboardOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      switch (e.key) {
        case " ":
        case "k":
        case "K":
          e.preventDefault();
          togglePlay();
          break;

        case "ArrowLeft":
          e.preventDefault();
          skipBackward(10);
          break;

        case "ArrowRight":
          e.preventDefault();
          skipForward(10);
          break;

        case "ArrowUp":
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.1));
          break;

        case "ArrowDown":
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.1));
          break;

        case "f":
        case "F": {
          const container = videoRef.current?.parentElement;
          if (!container) break;
          if (document.fullscreenElement) {
            void document.exitFullscreen();
          } else {
            void container.requestFullscreen();
          }
          break;
        }

        case "m":
        case "M":
          toggleMute();
          break;

        case ".":
          if (!isPlaying) {
            e.preventDefault();
            seek(currentTime + FRAME_DURATION);
          }
          break;

        case ",":
          if (!isPlaying) {
            e.preventDefault();
            seek(currentTime - FRAME_DURATION);
          }
          break;

        case ">": {
          const idx = SPEED_STEPS.indexOf(playbackRate);
          if (idx < SPEED_STEPS.length - 1) setPlaybackRate(SPEED_STEPS[idx + 1]);
          break;
        }

        case "<": {
          const idx = SPEED_STEPS.indexOf(playbackRate);
          if (idx > 0) setPlaybackRate(SPEED_STEPS[idx - 1]);
          break;
        }

        default:
          if (e.key >= "0" && e.key <= "9") {
            seekByPercent(parseInt(e.key) * 10);
          }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    videoRef,
    isPlaying,
    volume,
    currentTime,
    playbackRate,
    togglePlay,
    toggleMute,
    skipBackward,
    skipForward,
    setVolume,
    seekByPercent,
    seek,
    setPlaybackRate,
  ]);
}
