"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { getCategory } from "@/lib/categories";
import { getVisitorId } from "@/lib/visitor";
import type { Message } from "@/lib/types";

const POLL_MS = 3000;

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatBox({
  messageId,
  onClose,
}: {
  messageId: string;
  onClose?: () => void;
}) {
  const [message, setMessage] = useState<Message | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const visitorId = useRef(getVisitorId());

  async function fetchThread() {
    try {
      const res = await fetch(
        `/api/messages/${messageId}?visitorId=${encodeURIComponent(visitorId.current)}`,
        { cache: "no-store" }
      );
      if (!res.ok) return;
      const data = await res.json();
      setMessage(data.message);
    } catch {
      // silent — will retry on next poll
    }
  }

  useEffect(() => {
    fetchThread();
    const interval = setInterval(fetchThread, POLL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [message?.entries.length]);

  async function handleSend() {
    if (text.trim().length < 1 || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/messages/${messageId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId: visitorId.current, text: text.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível enviar.");
      } else {
        setMessage(data.message);
        setText("");
      }
    } catch {
      setError("Falha de conexão.");
    } finally {
      setSending(false);
    }
  }

  if (!message) {
    return (
      <div className="glass rounded-3xl border border-white/10 p-8 text-center text-white/40 text-sm">
        Carregando conversa...
      </div>
    );
  }

  const cat = getCategory(message.category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-3xl border border-white/10 flex flex-col overflow-hidden"
      style={{ boxShadow: `0 0 50px ${cat.glow}22` }}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <span
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-gradient-to-r ${cat.accent} bg-opacity-20`}
        >
          {cat.emoji} {cat.label}
        </span>
        {onClose && (
          <button
            onClick={onClose}
            className="text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            fechar ✕
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 max-h-[50vh] min-h-[220px] overflow-y-auto px-5 py-4 flex flex-col gap-3">
        {message.entries.map((entry) => (
          <div
            key={entry.id}
            className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              entry.from === "visitor"
                ? "self-end bg-white text-void"
                : "self-start bg-signal/15 border border-signal/30 text-white"
            }`}
          >
            {entry.from === "andry" && (
              <p className="text-[10px] font-mono text-signal2 mb-1">Andry 🚀</p>
            )}
            <p>{entry.text}</p>
            <p
              className={`text-[10px] font-mono mt-1 ${
                entry.from === "visitor" ? "text-void/40" : "text-white/30"
              }`}
            >
              {formatTime(entry.at)}
            </p>
          </div>
        ))}
      </div>

      {error && (
        <p className="text-xs text-ember bg-ember/10 border-t border-ember/30 px-5 py-2">{error}</p>
      )}

      <div className="flex items-center gap-2 border-t border-white/10 p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 500))}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          placeholder="Escreva mais alguma coisa pro Andry..."
          className="flex-1 rounded-full bg-black/30 border border-white/10 px-4 py-2.5 text-sm
                     placeholder:text-white/30 focus:border-signal2/60 outline-none transition-colors"
        />
        <button
          disabled={sending || text.trim().length < 1}
          onClick={handleSend}
          className="rounded-full bg-signal px-5 py-2.5 text-sm font-display font-semibold
                     disabled:opacity-30 disabled:cursor-not-allowed transition-transform active:scale-95"
        >
          🚀
        </button>
      </div>
    </motion.div>
  );
}
