"use client";

import { motion } from "framer-motion";

export default function AndryTag() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="group relative inline-flex items-center"
    >
      {/* glow */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-signal via-fuchsia-500 to-signal2 opacity-60 blur-lg animate-pulseGlow" />

      {/* floating particles */}
      <span className="absolute -top-1.5 left-4 h-1 w-1 rounded-full bg-signal2 animate-drift" style={{ animationDelay: "0.2s" }} />
      <span className="absolute -bottom-1 right-6 h-1 w-1 rounded-full bg-gold animate-drift" style={{ animationDelay: "1.1s" }} />
      <span className="absolute top-0 right-2 h-0.5 w-0.5 rounded-full bg-white animate-drift" style={{ animationDelay: "0.6s" }} />

      <div
        className="relative flex items-center gap-2 rounded-full border border-white/15 px-4 py-1.5
                   bg-gradient-to-r from-[#1a1530] via-[#20172f] to-[#161225]
                   shadow-[0_0_25px_rgba(123,92,255,0.35)]
                   transition-transform duration-300 ease-out
                   group-hover:scale-[1.04] group-hover:shadow-[0_0_35px_rgba(61,217,198,0.45)]"
      >
        <span className="text-sm">👨‍💻</span>
        <span className="font-mono text-[11px] tracking-wide text-mist">
          programador
        </span>
        <span className="relative overflow-hidden font-display text-xs font-semibold text-white">
          <span className="relative z-10">ANDRY</span>
        </span>

        {/* sheen sweep */}
        <span
          className="pointer-events-none absolute inset-0 rounded-full opacity-70"
          style={{
            background:
              "linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.5) 48%, transparent 66%)",
            backgroundSize: "250% 100%",
            animation: "sheen 3.5s ease-in-out infinite",
          }}
        />
      </div>
    </motion.div>
  );
}
