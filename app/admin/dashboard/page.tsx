"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CATEGORIES, getCategory } from "@/lib/categories";
import type { Message } from "@/lib/types";

type FilterId = "todas" | "novas" | "respondidas" | "arquivadas" | Message["category"];

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "todas", label: "📬 Todas" },
  { id: "novas", label: "🆕 Novas" },
  ...CATEGORIES.map((c) => ({ id: c.id as FilterId, label: `${c.emoji} ${c.label}` })),
  { id: "respondidas", label: "✅ Respondidas" },
  { id: "arquivadas", label: "📁 Arquivadas" },
];

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora mesmo";
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const date = new Date(ts);
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export default function DashboardPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [filter, setFilter] = useState<FilterId>("todas");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    const res = await fetch("/api/messages", { cache: "no-store" });
    if (res.status === 401) {
      router.push("/admin");
      return;
    }
    const data = await res.json();
    setMessages(data.messages || []);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchMessages();
    // Keep polling even with a message open, so new replies from the
    // visitor show up live in the conversation.
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const filtered = useMemo(() => {
    let list = messages;
    if (filter === "novas") list = list.filter((m) => m.status === "nova");
    else if (filter === "respondidas") list = list.filter((m) => m.status === "respondida");
    else if (filter === "arquivadas") list = list.filter((m) => m.status === "arquivada");
    else if (filter !== "todas") list = list.filter((m) => m.category === filter);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.entries.some((e) => e.text.toLowerCase().includes(q))
      );
    }
    return list;
  }, [messages, filter, search]);

  const selected = messages.find((m) => m.id === selectedId) || null;

  useEffect(() => {
    setReplyText("");
  }, [selectedId]);

  async function openMessage(m: Message) {
    setSelectedId(m.id);
    if (m.status === "nova") {
      await patchMessage(m.id, { status: "lida" });
    }
  }

  async function patchMessage(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      setMessages((prev) => prev.map((m) => (m.id === id ? data.message : m)));
    }
  }

  async function handleReply() {
    if (!selected || replyText.trim().length < 1) return;
    setSending(true);
    await patchMessage(selected.id, { reply: replyText.trim() });
    setReplyText("");
    setSending(false);
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
  }

  const newCount = messages.filter((m) => m.status === "nova").length;

  return (
    <main className="min-h-[100dvh] bg-void text-white flex flex-col">
      <header className="sticky top-0 z-20 glass border-b border-white/10 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">👑</span>
          <h1 className="font-display font-semibold">Painel do Andry</h1>
          {newCount > 0 && (
            <span className="rounded-full bg-ember/20 text-ember text-xs font-mono px-2 py-0.5">
              {newCount} nova{newCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-white/40 hover:text-white/70 transition-colors font-mono"
        >
          sair →
        </button>
      </header>

      <div className="px-5 py-4 flex flex-col gap-3 border-b border-white/5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar por nome ou conteúdo..."
          className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-2.5 text-sm
                     placeholder:text-white/30 focus:border-signal2/60 outline-none transition-colors"
        />
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors ${
                filter === f.id
                  ? "bg-signal border-signal text-white"
                  : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] overflow-hidden">
        <section className="overflow-y-auto px-5 py-4 flex flex-col gap-3">
          {loading && <p className="text-sm text-white/40">Carregando mensagens...</p>}
          {!loading && filtered.length === 0 && (
            <p className="text-sm text-white/40">Nenhuma mensagem por aqui ainda.</p>
          )}
          <AnimatePresence>
            {filtered.map((m) => {
              const cat = getCategory(m.category);
              return (
                <motion.button
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  onClick={() => openMessage(m)}
                  className={`text-left rounded-2xl border p-4 transition-colors ${
                    selectedId === m.id
                      ? "border-signal2/60 bg-white/5"
                      : "border-white/10 bg-white/[0.02] hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold flex items-center gap-1">
                      {cat.emoji} {cat.label.toUpperCase()}
                    </span>
                    {m.status === "nova" && (
                      <span className="text-[10px] font-mono text-ember">🔴 NOVA</span>
                    )}
                    {m.status === "respondida" && (
                      <span className="text-[10px] font-mono text-signal2">✅</span>
                    )}
                    {m.status === "arquivada" && (
                      <span className="text-[10px] font-mono text-white/30">📁</span>
                    )}
                  </div>
                  <p className="text-xs text-white/50 mb-1">👤 {m.name}</p>
                  <p className="text-sm text-white/80 line-clamp-2">
                    "{m.entries[m.entries.length - 1]?.text}"
                  </p>
                  <p className="text-[10px] font-mono text-white/30 mt-2">
                    🕐 {timeAgo(m.updatedAt)} · 📍 {m.ip}
                  </p>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </section>

        <section className="hidden lg:flex flex-col border-l border-white/10 overflow-y-auto">
          {selected ? (
            <MessageDetail
              key={selected.id}
              message={selected}
              replyText={replyText}
              setReplyText={setReplyText}
              onReply={handleReply}
              onArchive={() => patchMessage(selected.id, { status: "arquivada" })}
              sending={sending}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-white/30 text-sm">
              Selecione uma mensagem para ver os detalhes
            </div>
          )}
        </section>
      </div>

      {/* mobile detail overlay */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-30 bg-void"
          >
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <button
                  onClick={() => setSelectedId(null)}
                  className="text-sm text-white/50 hover:text-white/80"
                >
                  ← voltar
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <MessageDetail
                  message={selected}
                  replyText={replyText}
                  setReplyText={setReplyText}
                  onReply={handleReply}
                  onArchive={() => patchMessage(selected.id, { status: "arquivada" })}
                  sending={sending}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function MessageDetail({
  message,
  replyText,
  setReplyText,
  onReply,
  onArchive,
  sending,
}: {
  message: Message;
  replyText: string;
  setReplyText: (v: string) => void;
  onReply: () => void;
  onArchive: () => void;
  sending: boolean;
}) {
  const cat = getCategory(message.category);
  return (
    <div className="p-6 flex flex-col gap-5">
      <div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-gradient-to-r ${cat.accent} bg-opacity-20 mb-3`}
        >
          {cat.emoji} {cat.label}
        </span>
        <p className="text-sm text-white/50">👤 {message.name}</p>
        <p className="text-[11px] font-mono text-white/30 mt-1">
          🕐 {new Date(message.createdAt).toLocaleString("pt-BR")} · 📍 IP: {message.ip}
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        {message.entries.map((entry) => (
          <div
            key={entry.id}
            className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              entry.from === "andry"
                ? "self-end bg-signal/15 border border-signal/30"
                : "self-start bg-white/5 border border-white/10"
            }`}
          >
            {entry.from === "andry" && (
              <p className="text-[10px] font-mono text-signal2 mb-1">sua resposta 🚀</p>
            )}
            <p>"{entry.text}"</p>
            <p className="text-[10px] font-mono text-white/30 mt-1">
              {new Date(entry.at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs text-white/40">Escreva uma resposta...</label>
        <textarea
          value={replyText}
          onChange={(e) => setReplyText(e.target.value.slice(0, 1000))}
          rows={4}
          className="w-full resize-none rounded-2xl bg-black/30 border border-white/10 px-4 py-3
                     text-sm placeholder:text-white/30 focus:border-signal2/60 outline-none transition-colors"
          placeholder="Escreva uma resposta..."
        />
        <div className="flex gap-2 justify-end">
          <button
            onClick={onArchive}
            className="rounded-full border border-white/15 px-4 py-2.5 text-xs text-white/60 hover:bg-white/5 transition-colors"
          >
            📁 Arquivar
          </button>
          <button
            disabled={sending || replyText.trim().length < 1}
            onClick={onReply}
            className="rounded-full bg-signal px-6 py-2.5 text-sm font-display font-semibold
                       disabled:opacity-30 disabled:cursor-not-allowed transition-transform active:scale-95"
          >
            🚀 Responder
          </button>
        </div>
      </div>
    </div>
  );
}
