import type { ReactNode } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipForward,
  SkipBack,
  Gauge,
  ChevronRight,
  ChevronLeft,
  Loader2,
} from "lucide-react";

export type FeedbackType =
  | "play"
  | "pause"
  | "volumeUp"
  | "volumeDown"
  | "mute"
  | "unmute"
  | "speedUp"
  | "speedDown"
  | "seekForward"
  | "seekBackward"
  | "frameForward"
  | "frameBackward";

export interface FeedbackState {
  type: FeedbackType;
  value?: number;
  id: number;
}

const KEYFRAME_STYLE = `
@keyframes vp-feedback {
  0%   { opacity: 0; transform: scale(0.8); }
  12%  { opacity: 1; transform: scale(1.05); }
  20%  { opacity: 1; transform: scale(1); }
  70%  { opacity: 1; }
  100% { opacity: 0; }
}
`;

function getFeedbackContent(
  type: FeedbackType,
  value?: number,
): { icon: ReactNode; label: string | null } {
  switch (type) {
    case "play":
      return {
        icon: <Play className="w-8 h-8 text-white" fill="currentColor" />,
        label: null,
      };
    case "pause":
      return {
        icon: <Pause className="w-8 h-8 text-white" fill="currentColor" />,
        label: null,
      };
    case "volumeUp":
    case "volumeDown":
      return {
        icon: <Volume2 className="w-6 h-6 text-white" />,
        label: value !== undefined ? `${Math.round(value * 100)}%` : null,
      };
    case "mute":
      return { icon: <VolumeX className="w-6 h-6 text-white" />, label: "Muted" };
    case "unmute":
      return {
        icon: <Volume2 className="w-6 h-6 text-white" />,
        label: value !== undefined ? `${Math.round(value * 100)}%` : null,
      };
    case "speedUp":
    case "speedDown":
      return {
        icon: <Gauge className="w-6 h-6 text-white" />,
        label: value !== undefined ? `${value}x` : null,
      };
    case "seekForward":
      return { icon: <SkipForward className="w-7 h-7 text-white" />, label: "+10s" };
    case "seekBackward":
      return { icon: <SkipBack className="w-7 h-7 text-white" />, label: "−10s" };
    case "frameForward":
      return { icon: <ChevronRight className="w-7 h-7 text-white" />, label: "+1f" };
    case "frameBackward":
      return { icon: <ChevronLeft className="w-7 h-7 text-white" />, label: "−1f" };
  }
}

interface VideoPlayerFeedbackProps {
  feedback: FeedbackState | null;
  isBuffering: boolean;
}

export function VideoPlayerFeedback({
  feedback,
  isBuffering,
}: VideoPlayerFeedbackProps) {
  if (!isBuffering && !feedback) return null;

  return (
    <>
      <style>{KEYFRAME_STYLE}</style>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        {isBuffering ? (
          <div className="w-20 h-20 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        ) : (
          (() => {
            const { icon, label } = getFeedbackContent(feedback!.type, feedback!.value);
            return (
              <div
                key={feedback!.id}
                className="w-20 h-20 rounded-full bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-1"
                style={{ animation: "vp-feedback 1.5s ease-out forwards" }}
              >
                {icon}
                {label && (
                  <span className="text-white text-[11px] font-medium leading-none">
                    {label}
                  </span>
                )}
              </div>
            );
          })()
        )}
      </div>
    </>
  );
}
