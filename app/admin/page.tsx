"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AmbientBackground from "@/components/AmbientBackground";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Senha incorreta.");
        setLoading(false);
        return;
      }
      router.push("/admin/dashboard");
    } catch {
      setError("Falha de conexão.");
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-[100dvh] flex items-center justify-center px-5">
      <AmbientBackground />
      <form
        onSubmit={handleSubmit}
        className="glass w-full max-w-sm rounded-3xl border border-white/10 p-8 flex flex-col gap-5"
      >
        <div className="text-center">
          <span className="text-3xl">👑</span>
          <h1 className="font-display text-xl font-semibold mt-2">Painel do Andry</h1>
          <p className="text-xs text-white/40 mt-1">Acesso restrito ao proprietário</p>
        </div>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha de acesso"
          className="w-full rounded-2xl bg-black/30 border border-white/10 px-5 py-3.5
                     text-base placeholder:text-white/30 focus:border-signal2/60 outline-none transition-colors"
        />
        {error && (
          <p className="text-sm text-ember bg-ember/10 border border-ember/30 rounded-xl px-4 py-2 text-center">
            {error}
          </p>
        )}
        <button
          disabled={loading || !password}
          type="submit"
          className="rounded-full bg-signal px-6 py-3.5 font-display font-semibold
                     disabled:opacity-30 disabled:cursor-not-allowed transition-transform active:scale-95"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
