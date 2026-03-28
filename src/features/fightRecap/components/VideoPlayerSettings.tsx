import { useEffect, useRef, useState } from "react";
import {
  Settings,
  Gauge,
  ChevronRight,
  ArrowLeft,
  Check,
  Keyboard,
} from "lucide-react";
import { Button } from "./ui/Button";

type SettingsView = "main" | "playback" | "shortcuts";

interface VideoPlayerSettingsProps {
  playbackRate: number;
  setPlaybackRate: (rate: number) => void;
}

const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const SHORTCUTS = [
  { keys: ["Space", "K"], label: "Play / Pause" },
  { keys: ["←"], label: "Seek back 10s" },
  { keys: ["→"], label: "Seek forward 10s" },
  { keys: ["↑"], label: "Volume up 10%" },
  { keys: ["↓"], label: "Volume down 10%" },
  { keys: ["F"], label: "Toggle fullscreen" },
  { keys: ["M"], label: "Toggle mute" },
  { keys: ["."], label: "Next frame (paused)" },
  { keys: [","], label: "Prev frame (paused)" },
  { keys: [">"], label: "Speed up" },
  { keys: ["<"], label: "Speed down" },
  { keys: ["0 – 9"], label: "Jump to 0% – 90%" },
];

// Heights per view (px):
// main:      py-1 (8) + 2 rows × 36px          =  80px
// playback:  py-1 (8) + header (37) + 8 × 36   = 333px
// shortcuts: header (37) + 12 rows × 30px       = 397px
const VIEW_HEIGHTS: Record<SettingsView, number> = {
  main: 80,
  playback: 333,
  shortcuts: 397,
};

export function VideoPlayerSettings({
  playbackRate,
  setPlaybackRate,
}: VideoPlayerSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<SettingsView>("main");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
        setView("main");
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen((prev) => {
      if (prev) setView("main");
      return !prev;
    });
  };

  const slideX = (panelView: SettingsView) => {
    if (view === panelView) return "translateX(0)";
    // sub-panels start off-screen to the right; main slides out to the left
    if (panelView === "main") return "translateX(-100%)";
    return "translateX(100%)";
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Gear button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggle}
        className="text-foreground hover:bg-secondary/50 h-8 w-8"
      >
        <Settings
          className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "rotate-45" : "rotate-0"}`}
        />
      </Button>

      {/* Panel */}
      <div
        className={`absolute bottom-full right-0 mb-2 w-60 rounded-lg bg-black/60 backdrop-blur-sm overflow-hidden transition-all duration-200 origin-bottom-right ${
          isOpen
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
        style={{ height: VIEW_HEIGHTS[view] }}
      >
        {/* ── Main panel ── */}
        <div
          className="absolute inset-x-0 top-0 py-1 transition-transform duration-200"
          style={{ transform: slideX("main") }}
        >
          {/* Playback speed row */}
          <button
            className="w-full flex items-center justify-between px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors"
            onClick={() => setView("playback")}
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

          {/* Shortcuts row */}
          <button
            className="w-full flex items-center justify-between px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors"
            onClick={() => setView("shortcuts")}
          >
            <div className="flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-white/70" />
              <span>Shortcuts</span>
            </div>
            <ChevronRight className="w-3 h-3 text-white/50" />
          </button>
        </div>

        {/* ── Playback speed panel ── */}
        <div
          className="absolute inset-x-0 top-0 py-1 transition-transform duration-200"
          style={{ transform: slideX("playback") }}
        >
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors border-b border-white/5"
            onClick={() => setView("main")}
          >
            <ArrowLeft className="w-4 h-4 text-white/70" />
            <span>Playback speed</span>
          </button>
          {SPEED_OPTIONS.map((rate) => (
            <button
              key={rate}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors"
              onClick={() => {
                setPlaybackRate(rate);
                setIsOpen(false);
                setView("main");
              }}
            >
              <span>{rate === 1 ? "Normal" : `${rate}x`}</span>
              {rate === playbackRate && (
                <Check className="w-4 h-4 text-primary" />
              )}
            </button>
          ))}
        </div>

        {/* ── Shortcuts panel ── */}
        <div
          className="absolute inset-0 transition-transform duration-200 flex flex-col"
          style={{ transform: slideX("shortcuts") }}
        >
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors border-b border-white/5 flex-shrink-0"
            onClick={() => setView("main")}
          >
            <ArrowLeft className="w-4 h-4 text-white/70" />
            <span>Shortcuts</span>
          </button>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {SHORTCUTS.map(({ keys, label }) => (
              <div
                key={label}
                className="flex items-center justify-between px-3 py-[7px] bg-white/5"
              >
                <span className="text-xs text-white/60">{label}</span>
                <div className="flex items-center gap-1">
                  {keys.map((k) => (
                    <kbd
                      key={k}
                      className="bg-white/15 rounded px-1.5 py-0.5 text-[11px] font-mono text-white/80 leading-none"
                    >
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
