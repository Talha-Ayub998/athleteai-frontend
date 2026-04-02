import { useEffect, useRef } from "react";

declare global {
  interface Window {
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

interface YouTubePlayerProps {
  videoId: string;
  onTimeUpdate?: (time: number) => void;
  onDurationChange?: (duration: number) => void;
}

let apiLoadPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (apiLoadPromise) return apiLoadPromise;

  apiLoadPromise = new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve();
      return;
    }

    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prevReady?.();
      resolve();
    };

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  });

  return apiLoadPromise;
}

export function YouTubePlayer({
  videoId,
  onTimeUpdate,
  onDurationChange,
}: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onDurationChangeRef = useRef(onDurationChange);

  // Keep refs up to date without re-creating the player
  onTimeUpdateRef.current = onTimeUpdate;
  onDurationChangeRef.current = onDurationChange;

  useEffect(() => {
    let destroyed = false;

    const startPolling = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        const player = playerRef.current;
        if (!player) return;
        try {
          const time = player.getCurrentTime?.();
          if (typeof time === "number" && isFinite(time)) {
            onTimeUpdateRef.current?.(time);
          }
        } catch {
          // player may not be ready yet
        }
      }, 250);
    };

    void loadYouTubeApi().then(() => {
      if (destroyed || !containerRef.current) return;

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onReady: (event) => {
            if (destroyed) return;
            const duration = event.target.getDuration?.();
            if (typeof duration === "number" && isFinite(duration)) {
              onDurationChangeRef.current?.(duration);
            }
            startPolling();
          },
          onStateChange: (event) => {
            if (destroyed) return;
            // YT.PlayerState.PLAYING === 1
            if (event.data === 1) {
              startPolling();
            }
          },
        },
      });
    });

    return () => {
      destroyed = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      try {
        playerRef.current?.destroy();
      } catch {
        // ignore
      }
      playerRef.current = null;
    };
  }, [videoId]);

  return (
    <div
      className="relative w-full bg-black rounded-lg overflow-hidden"
      style={{ paddingBottom: "56.25%" }}
    >
      <div
        ref={containerRef}
        className="absolute top-0 left-0 w-full h-full"
      />
    </div>
  );
}
