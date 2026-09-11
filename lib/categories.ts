export type CategoryId =
  | "shippar"
  | "segredo"
  | "confissao"
  | "pergunta"
  | "fofoca"
  | "opiniao"
  | "crush"
  | "conselho"
  | "desafio"
  | "especial"
  | "alerta"
  | "outro";

export interface Category {
  id: CategoryId;
  emoji: string;
  label: string;
  teaser: string;
  boxTitle: string;
  placeholder: string;
  accent: string; // tailwind gradient classes
  glow: string; // hex used for box-shadow / glow color
}

export const CATEGORIES: Category[] = [
  {
    id: "shippar",
    emoji: "💘",
    label: "Shippar",
    teaser: "Quero falar sobre você e alguém 👀",
    boxTitle: "Quem você acha que combina com o Andry? 👀",
    placeholder: "Conta quem você tá shippando com o Andry...",
    accent: "from-pink-500 via-rose-500 to-fuchsia-500",
    glow: "#ff5ba7",
  },
  {
    id: "segredo",
    emoji: "🤫",
    label: "Segredo",
    teaser: "Tenho uma coisa para revelar...",
    boxTitle: "Pode contar... só o Andry vai ver isso.",
    placeholder: "Sussurra esse segredo aqui...",
    accent: "from-indigo-600 via-violet-600 to-purple-700",
    glow: "#8b5cf6",
  },
  {
    id: "confissao",
    emoji: "👀",
    label: "Confissão",
    teaser: "Preciso confessar uma coisa.",
    boxTitle: "Desembucha, o Andry tá te ouvindo.",
    placeholder: "Escreva sua confissão...",
    accent: "from-slate-600 via-slate-500 to-zinc-600",
    glow: "#94a3b8",
  },
  {
    id: "pergunta",
    emoji: "💭",
    label: "Pergunta",
    teaser: "Tenho uma pergunta para você.",
    boxTitle: "Manda sua pergunta pro Andry.",
    placeholder: "O que você quer perguntar?",
    accent: "from-sky-500 via-cyan-500 to-teal-500",
    glow: "#22d3ee",
  },
  {
    id: "fofoca",
    emoji: "😂",
    label: "Fofoca",
    teaser: "Tenho uma fofoca quente...",
    boxTitle: "Solta a fofoca 👀",
    placeholder: "Qual é a fofoca?",
    accent: "from-amber-400 via-orange-500 to-yellow-500",
    glow: "#f59e0b",
  },
  {
    id: "opiniao",
    emoji: "🔥",
    label: "Opinião sincera",
    teaser: "Vou falar o que realmente penso.",
    boxTitle: "Fala sem medo, o Andry aguenta.",
    placeholder: "Diga sua opinião sincera...",
    accent: "from-orange-600 via-red-500 to-rose-600",
    glow: "#ef4444",
  },
  {
    id: "crush",
    emoji: "🫣",
    label: "Crush",
    teaser: "Tem alguém que precisa saber disso...",
    boxTitle: "Quem é o crush? Conta pro Andry 🫣",
    placeholder: "Me conta essa história...",
    accent: "from-rose-400 via-pink-400 to-red-400",
    glow: "#fb7185",
  },
  {
    id: "conselho",
    emoji: "🧠",
    label: "Conselho",
    teaser: "Preciso da sua opinião.",
    boxTitle: "Qual é a situação? O Andry quer ajudar.",
    placeholder: "Descreva sua situação...",
    accent: "from-emerald-500 via-teal-500 to-green-600",
    glow: "#10b981",
  },
  {
    id: "desafio",
    emoji: "🎯",
    label: "Desafio",
    teaser: "Tenho um desafio para você.",
    boxTitle: "Qual é o desafio pro Andry? 🎯",
    placeholder: "Descreva o desafio...",
    accent: "from-lime-500 via-green-500 to-emerald-500",
    glow: "#84cc16",
  },
  {
    id: "especial",
    emoji: "💌",
    label: "Mensagem especial",
    teaser: "Só queria deixar uma mensagem.",
    boxTitle: "Deixe sua mensagem especial pro Andry 💌",
    placeholder: "Escreva com carinho...",
    accent: "from-fuchsia-500 via-purple-500 to-indigo-500",
    glow: "#a855f7",
  },
  {
    id: "alerta",
    emoji: "🚨",
    label: "Alerta",
    teaser: "Andry, você precisa saber disso.",
    boxTitle: "O que o Andry precisa saber urgente?",
    placeholder: "Conta o que aconteceu...",
    accent: "from-red-600 via-orange-600 to-amber-600",
    glow: "#f97316",
  },
  {
    id: "outro",
    emoji: "✨",
    label: "Algo além...",
    teaser: "É outra coisa completamente diferente.",
    boxTitle: "Manda o que quiser pro Andry ✨",
    placeholder: "Escreva sua mensagem...",
    accent: "from-violet-500 via-indigo-500 to-blue-500",
    glow: "#818cf8",
  },
];

export function getCategory(id: string): Category {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}
