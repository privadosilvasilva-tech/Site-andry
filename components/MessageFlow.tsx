"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CATEGORIES, getCategory, CategoryId } from "@/lib/categories";
import { getVisitorId, rememberSentMessageId } from "@/lib/visitor";
import ChatBox from "./ChatBox";

type Step = "hero" | "name" | "category" | "message" | "sending" | "sent";

const easeOut = [0.16, 1, 0.3, 1] as const;

function StepShell({
  children,
  stepKey,
}: {
  children: React.ReactNode;
  stepKey: string;
}) {
  return (
    <motion.div
      key={stepKey}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.45, ease: easeOut }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

export default function MessageFlow() {
  const [step, setStep] = useState<Step>("hero");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [sentId, setSentId] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (step === "name") {
      setTimeout(() => nameInputRef.current?.focus(), 350);
    }
    if (step === "message") {
      setTimeout(() => textareaRef.current?.focus(), 350);
    }
  }, [step]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const activeCategory = category ? getCategory(category) : null;

  async function handleSend() {
    if (!name || !category || text.trim().length < 2) return;
    setSubmitting(true);
    setError(null);
    setStep("sending");

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, text: text.trim(), visitorId: getVisitorId() }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setCooldown(data.retryAfterSeconds ?? 60);
          setError(data.error || "Aguarde antes de enviar outra mensagem.");
        } else {
          setError(data.error || "Não foi possível enviar. Tente novamente.");
        }
        setStep("message");
        setSubmitting(false);
        return;
      }

      rememberSentMessageId(data.id);
      setSentId(data.id);
      setCooldown(60);
      await new Promise((r) => setTimeout(r, 1400));
      setStep("sent");
    } catch {
      setError("Falha de conexão. Tente novamente.");
      setStep("message");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForAnother() {
    setText("");
    setCategory(null);
    setError(null);
    setStep("category");
  }

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <AnimatePresence mode="wait">
        {step === "hero" && (
          <StepShell stepKey="hero">
            <div className="text-center flex flex-col items-center gap-7">
              <p className="font-mono text-xs tracking-wide text-signal2/90">
                transmissão anônima · sem login · sem cadastro
              </p>
              <h1 className="font-display text-[2.35rem] leading-[1.08] sm:text-6xl font-semibold sheen-text animate-sheen">
                Envie uma
                <br />
                mensagem para
                <br />
                o Andry
              </h1>
              <p className="max-w-sm text-mist text-base sm:text-lg">
                Shippa, conta um segredo, manda uma fofoca ou só diz o que
                pensa. Ninguém vai saber quem enviou — a não ser que você
                queira.
              </p>
              <button
                onClick={() => setStep("name")}
                className="group relative mt-2 inline-flex items-center gap-2 rounded-full bg-white text-void
                           px-8 py-4 font-display font-semibold text-base sm:text-lg
                           shadow-[0_0_40px_rgba(123,92,255,0.35)]
                           transition-transform duration-300 active:scale-95 hover:scale-[1.03]"
              >
                <span>Mandar uma mensagem</span>
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  🚀
                </span>
              </button>
            </div>
          </StepShell>
        )}

        {step === "name" && (
          <StepShell stepKey="name">
            <div className="glass rounded-3xl border border-white/10 p-7 sm:p-10 flex flex-col gap-6">
              <div>
                <p className="font-mono text-xs text-signal2/90 mb-2">passo 1 de 3</p>
                <h2 className="font-display text-2xl sm:text-3xl font-semibold">
                  👤 Como podemos te chamar?
                </h2>
              </div>
              <input
                ref={nameInputRef}
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 40))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && name.trim()) setStep("category");
                }}
                placeholder="Digite seu nome..."
                aria-label="Seu nome"
                className="w-full rounded-2xl bg-black/30 border border-white/10 px-5 py-4
                           text-lg placeholder:text-white/30 focus:border-signal2/60 outline-none
                           transition-colors"
              />
              <p className="text-xs text-white/40">
                Pode ser seu nome real ou um apelido. Não pedimos e-mail nem senha.
              </p>
              <button
                disabled={!name.trim()}
                onClick={() => setStep("category")}
                className="self-end rounded-full bg-signal px-7 py-3 font-display font-semibold
                           disabled:opacity-30 disabled:cursor-not-allowed
                           transition-all hover:bg-signal/90 active:scale-95"
              >
                Continuar →
              </button>
            </div>
          </StepShell>
        )}

        {step === "category" && (
          <StepShell stepKey="category">
            <div className="flex flex-col gap-6">
              <div className="text-center">
                <p className="font-mono text-xs text-signal2/90 mb-2">passo 2 de 3</p>
                <h2 className="font-display text-2xl sm:text-3xl font-semibold">
                  💭 O que você quer mandar pro Andry?
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setCategory(c.id);
                      setTimeout(() => setStep("message"), 180);
                    }}
                    className={`relative overflow-hidden rounded-2xl border border-white/10 p-4 text-left
                                bg-gradient-to-br ${c.accent} bg-opacity-10
                                transition-transform duration-200 active:scale-95 hover:-translate-y-0.5`}
                    style={{
                      boxShadow:
                        category === c.id ? `0 0 0 2px ${c.glow}, 0 0 24px ${c.glow}55` : undefined,
                    }}
                  >
                    <div className="absolute inset-0 bg-black/55" />
                    <div className="relative flex flex-col gap-1.5">
                      <span className="text-2xl">{c.emoji}</span>
                      <span className="font-display text-sm font-semibold">{c.label}</span>
                      <span className="text-[11px] text-white/50 leading-snug line-clamp-2">
                        {c.teaser}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep("name")}
                className="self-center text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                ← voltar
              </button>
            </div>
          </StepShell>
        )}

        {step === "message" && activeCategory && (
          <StepShell stepKey="message">
            <div
              className="glass rounded-3xl border border-white/10 p-7 sm:p-10 flex flex-col gap-5"
              style={{ boxShadow: `0 0 50px ${activeCategory.glow}22` }}
            >
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs text-signal2/90">passo 3 de 3</p>
                <span
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-gradient-to-r ${activeCategory.accent} bg-opacity-20`}
                >
                  {activeCategory.emoji} {activeCategory.label}
                </span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-semibold leading-snug">
                {activeCategory.boxTitle}
              </h2>

              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, 500))}
                  placeholder={activeCategory.placeholder}
                  aria-label="Sua mensagem"
                  rows={5}
                  className="w-full resize-none rounded-2xl bg-black/30 border border-white/10 px-5 py-4
                             text-base placeholder:text-white/30 focus:border-signal2/60 outline-none
                             transition-colors"
                />
                <span className="absolute bottom-3 right-4 font-mono text-[11px] text-white/30">
                  {text.length}/500
                </span>
              </div>

              {error && (
                <p className="text-sm text-ember bg-ember/10 border border-ember/30 rounded-xl px-4 py-2">
                  {error}
                </p>
              )}

              {cooldown > 0 && (
                <p className="text-sm text-gold bg-gold/10 border border-gold/30 rounded-xl px-4 py-2">
                  ⏳ Você poderá enviar outra mensagem em {cooldown}s
                </p>
              )}

              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => setStep("category")}
                  className="text-xs text-white/40 hover:text-white/70 transition-colors"
                >
                  ← trocar categoria
                </button>
                <button
                  disabled={text.trim().length < 2 || submitting || cooldown > 0}
                  onClick={handleSend}
                  className="inline-flex items-center gap-2 rounded-full bg-white text-void px-7 py-3.5
                             font-display font-semibold disabled:opacity-30 disabled:cursor-not-allowed
                             transition-transform active:scale-95 hover:scale-[1.03]"
                >
                  Enviar para o Andry <span>🚀</span>
                </button>
              </div>
            </div>
          </StepShell>
        )}

        {step === "sending" && (
          <StepShell stepKey="sending">
            <div className="glass rounded-3xl border border-white/10 p-14 flex flex-col items-center gap-6">
              <SendingAnimation />
              <p className="font-display text-lg">Transmitindo mensagem...</p>
            </div>
          </StepShell>
        )}

        {step === "sent" && sentId && (
          <StepShell stepKey="sent">
            <div className="flex flex-col items-center gap-5">
              <div className="text-center flex flex-col items-center gap-2">
                <motion.span
                  initial={{ scale: 0.4, rotate: -20, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 220, damping: 14 }}
                  className="text-4xl"
                >
                  🚀
                </motion.span>
                <h2 className="font-display text-xl sm:text-2xl font-semibold">
                  Mensagem enviada!
                </h2>
                <p className="text-mist text-sm">
                  Chegou até o Andry. Fique aqui que a resposta aparece nessa caixinha, ao vivo.
                </p>
              </div>

              <div className="w-full">
                <ChatBox messageId={sentId} />
              </div>

              {cooldown > 0 ? (
                <p className="text-xs text-gold bg-gold/10 border border-gold/30 rounded-xl px-4 py-2">
                  ⏳ Você poderá abrir outra caixinha em {cooldown}s (pode continuar conversando nessa aqui)
                </p>
              ) : (
                <button
                  onClick={resetForAnother}
                  className="text-sm text-white/50 hover:text-white/80 transition-colors"
                >
                  + Mandar outra mensagem em uma caixinha nova
                </button>
              )}
            </div>
          </StepShell>
        )}
      </AnimatePresence>
    </div>
  );
}

function SendingAnimation() {
  const dots = Array.from({ length: 10 });
  return (
    <div className="relative h-20 w-20">
      <div className="absolute inset-0 rounded-full border-2 border-signal/30 animate-ping" />
      <div className="absolute inset-2 rounded-full border-2 border-signal2/40" />
      <div className="absolute inset-0 flex items-center justify-center text-3xl">🚀</div>
      {dots.map((_, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, x: 0, y: 0 }}
          animate={{
            opacity: [0, 1, 0],
            x: Math.cos((i / dots.length) * Math.PI * 2) * 60,
            y: Math.sin((i / dots.length) * Math.PI * 2) * 60,
          }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.08, ease: "easeOut" }}
          className="absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-signal2"
        />
      ))}
    </div>
  );
}
