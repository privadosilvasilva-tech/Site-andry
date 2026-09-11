import AmbientBackground from "@/components/AmbientBackground";
import AndryTag from "@/components/AndryTag";
import MessageFlow from "@/components/MessageFlow";

export default function Home() {
  return (
    <main className="relative min-h-[100dvh] flex flex-col items-center px-5 py-10 sm:py-14">
      <AmbientBackground />

      <div className="mb-10 sm:mb-14">
        <AndryTag />
      </div>

      <div className="flex-1 w-full flex items-center justify-center">
        <MessageFlow />
      </div>

      <footer className="mt-14 text-center text-[11px] text-white/25 font-mono">
        feito com 🚀 por Andry
      </footer>
    </main>
  );
}
