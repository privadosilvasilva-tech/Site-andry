"use client";

import { useEffect, useRef, useState } from "react";

const VIDEO_ID = "nB8NCaEG9AY";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

/**
 * Hidden YouTube audio player that tries to autoplay as soon as the site
 * opens, plus a small floating control (play / pause / restart).
 *
 * Browser note: Chrome, Safari and Firefox all block audio that starts
 * automatically with sound before the visitor has interacted with the page
 * at all — that's a browser policy, not something a website can turn off.
 * So this tries to autoplay right away, and as a fallback also starts the
 * song (unmuted) on the very first click/tap anywhere on the page if it
 * hasn't started yet. In practice the music kicks in the moment someone
 * opens the site and taps anything.
 */
export default function MusicPlayer() {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    function createPlayer() {
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: VIDEO_ID,
        width: "0",
        height: "0",
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          playsinline: 1,
          loop: 1,
          playlist: VIDEO_ID,
        },
        events: {
          onReady: (e: any) => {
            try {
              e.target.playVideo();
            } catch {
              /* autoplay blocked, will start on first interaction */
            }
          },
          onStateChange: (e: any) => {
            if (e.data === window.YT.PlayerState.PLAYING) {
              startedRef.current = true;
              setPlaying(true);
            } else if (e.data === window.YT.PlayerState.PAUSED) {
              setPlaying(false);
            }
          },
        },
      });
    }

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
      window.onYouTubeIframeAPIReady = createPlayer;
    }

    function unlockOnFirstInteraction() {
      if (!startedRef.current && playerRef.current?.playVideo) {
        try {
          playerRef.current.unMute?.();
          playerRef.current.playVideo();
        } catch {
          /* ignore */
        }
      }
    }
    window.addEventListener("click", unlockOnFirstInteraction, { once: true });
    window.addEventListener("touchstart", unlockOnFirstInteraction, { once: true });

    return () => {
      window.removeEventListener("click", unlockOnFirstInteraction);
      window.removeEventListener("touchstart", unlockOnFirstInteraction);
    };
  }, []);

  function handlePlay() {
    playerRef.current?.playVideo?.();
  }
  function handlePause() {
    playerRef.current?.pauseVideo?.();
  }
  function handleRestart() {
    playerRef.current?.seekTo?.(0, true);
    playerRef.current?.playVideo?.();
  }

  return (
    <>
      <div ref={containerRef} className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0" />
      <div
        className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 rounded-full glass border border-white/10
                   px-2.5 py-2 shadow-[0_0_25px_rgba(123,92,255,0.25)]"
      >
        <span className="pl-1 pr-0.5 text-sm" title="Música do site">
          {playing ? "🎵" : "🔇"}
        </span>
        <button
          onClick={handlePlay}
          aria-label="Tocar música"
          className="h-8 w-8 rounded-full flex items-center justify-center text-sm hover:bg-white/10 transition-colors"
        >
          ▶️
        </button>
        <button
          onClick={handlePause}
          aria-label="Pausar música"
          className="h-8 w-8 rounded-full flex items-center justify-center text-sm hover:bg-white/10 transition-colors"
        >
          ⏸️
        </button>
        <button
          onClick={handleRestart}
          aria-label="Reiniciar música"
          className="h-8 w-8 rounded-full flex items-center justify-center text-sm hover:bg-white/10 transition-colors"
        >
          🔁
        </button>
      </div>
    </>
  );
}
