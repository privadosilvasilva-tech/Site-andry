"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getCategory } from "@/lib/categories";
import { getVisitorId } from "@/lib/visitor";
import type { Message } from "@/lib/types";
import ChatBox from "./ChatBox";

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora mesmo";
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  return new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export default function MyMessages({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const visitorId = getVisitorId();
    fetch(`/api/messages/mine?visitorId=${encodeURIComponent(visitorId)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setMessages(data.messages || []))
      .catch(() => setMessages([]));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 py-8"
      onClick={(e) => e.target === e.currentTarget && !openId && onClose()}
    >
      <div className="w-full max-w-md max-h-[85vh] flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-white">
            📬 Minhas caixinhas
          </h2>
          <button
            onClick={onClose}
            className="text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            fechar ✕
          </button>
        </div>

        <AnimatePresence mode="wait">
          {openId ? (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ChatBox messageId={openId} onClose={() => setOpenId(null)} />
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass rounded-3xl border border-white/10 overflow-y-auto flex flex-col divide-y divide-white/5"
            >
              {messages === null && (
                <p className="p-6 text-sm text-white/40 text-center">Carregando...</p>
              )}
              {messages && messages.length === 0 && (
                <p className="p-6 text-sm text-white/40 text-center">
                  Você ainda não enviou nenhuma mensagem por aqui.
                </p>
              )}
              {messages?.map((m) => {
                const cat = getCategory(m.category);
                const last = m.entries[m.entries.length - 1];
                return (
                  <button
                    key={m.id}
                    onClick={() => setOpenId(m.id)}
                    className="text-left p-4 hover:bg-white/5 transition-colors flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">
                        {cat.emoji} {cat.label}
                      </span>
                      {m.status === "respondida" && (
                        <span className="text-[10px] font-mono text-signal2">✅ respondida</span>
                      )}
                    </div>
                    <p className="text-sm text-white/70 line-clamp-1">"{last?.text}"</p>
                    <p className="text-[10px] font-mono text-white/30">{timeAgo(m.updatedAt)}</p>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
