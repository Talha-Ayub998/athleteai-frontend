import { useEffect } from "react";
import type { RefObject } from "react";
import type { FeedbackType } from "../components/VideoPlayerFeedback";

const SPEED_STEPS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const FRAME_DURATION = 1 / 30;

interface UseVideoKeyboardOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  playbackRate: number;
  isMuted: boolean;
  togglePlay: () => void;
  toggleMute: () => void;
  skipBackward: (seconds?: number) => void;
  skipForward: (seconds?: number) => void;
  setVolume: (volume: number) => void;
  seekByPercent: (percent: number) => void;
  seek: (time: number) => void;
  setPlaybackRate: (rate: number) => void;
  onAction?: (type: FeedbackType, value?: number) => void;
}

export function useVideoKeyboard({
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
  onAction,
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
          onAction?.(isPlaying ? "pause" : "play");
          togglePlay();
          break;

        case "ArrowLeft":
          e.preventDefault();
          onAction?.("seekBackward");
          skipBackward(10);
          break;

        case "ArrowRight":
          e.preventDefault();
          onAction?.("seekForward");
          skipForward(10);
          break;

        case "ArrowUp": {
          e.preventDefault();
          const newVol = Math.min(1, volume + 0.1);
          onAction?.("volumeUp", newVol);
          setVolume(newVol);
          break;
        }

        case "ArrowDown": {
          e.preventDefault();
          const newVol = Math.max(0, volume - 0.1);
          onAction?.("volumeDown", newVol);
          setVolume(newVol);
          break;
        }

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
          onAction?.(isMuted ? "unmute" : "mute", isMuted ? volume : undefined);
          toggleMute();
          break;

        case ".":
          if (!isPlaying) {
            e.preventDefault();
            onAction?.("frameForward");
            seek(currentTime + FRAME_DURATION);
          }
          break;

        case ",":
          if (!isPlaying) {
            e.preventDefault();
            onAction?.("frameBackward");
            seek(currentTime - FRAME_DURATION);
          }
          break;

        case ">": {
          const idx = SPEED_STEPS.indexOf(playbackRate);
          if (idx < SPEED_STEPS.length - 1) {
            const newSpeed = SPEED_STEPS[idx + 1];
            onAction?.("speedUp", newSpeed);
            setPlaybackRate(newSpeed);
          }
          break;
        }

        case "<": {
          const idx = SPEED_STEPS.indexOf(playbackRate);
          if (idx > 0) {
            const newSpeed = SPEED_STEPS[idx - 1];
            onAction?.("speedDown", newSpeed);
            setPlaybackRate(newSpeed);
          }
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
    isMuted,
    togglePlay,
    toggleMute,
    skipBackward,
    skipForward,
    setVolume,
    seekByPercent,
    seek,
    setPlaybackRate,
    onAction,
  ]);
}
