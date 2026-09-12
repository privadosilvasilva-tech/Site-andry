"use client";

import { useState } from "react";
import AmbientBackground from "@/components/AmbientBackground";
import AndryTag from "@/components/AndryTag";
import MessageFlow from "@/components/MessageFlow";
import MusicPlayer from "@/components/MusicPlayer";
import MyMessages from "@/components/MyMessages";

export default function Home() {
  const [showMine, setShowMine] = useState(false);

  return (
    <main className="relative min-h-[100dvh] flex flex-col items-center px-5 py-10 sm:py-14">
      <AmbientBackground />
      <MusicPlayer />

      <button
        onClick={() => setShowMine(true)}
        className="fixed top-4 right-4 z-40 rounded-full glass border border-white/10 px-4 py-2
                   text-xs font-mono text-white/70 hover:text-white hover:bg-white/10 transition-colors"
      >
        📬 Minhas caixinhas
      </button>

      <div className="mb-10 sm:mb-14">
        <AndryTag />
      </div>

      <div className="flex-1 w-full flex items-center justify-center">
        <MessageFlow />
      </div>

      <footer className="mt-14 text-center text-[11px] text-white/25 font-mono">
        feito com 🚀 por Andry
      </footer>

      {showMine && <MyMessages onClose={() => setShowMine(false)} />}
    </main>
  );
}
