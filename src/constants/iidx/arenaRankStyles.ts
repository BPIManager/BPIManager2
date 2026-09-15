/** アリーナランク（A1〜B5）ごとの配色定義。通常UI（ArenaSection）とOGP画像生成（satori）の両方から参照する */
export const ARENA_CLASS_STYLES: Record<
  string,
  { glow: string; glow2: string; text: string; border: string }
> = {
  A1: {
    glow: "rgba(253,224,71,0.6)",
    glow2: "rgba(253,224,71,0.2)",
    text: "#fde047",
    border: "rgba(253,224,71,0.5)",
  },
  A2: {
    glow: "rgba(251,191,36,0.5)",
    glow2: "rgba(251,191,36,0.15)",
    text: "#fbbf24",
    border: "rgba(251,191,36,0.4)",
  },
  A3: {
    glow: "rgba(249,115,22,0.5)",
    glow2: "rgba(249,115,22,0.15)",
    text: "#f97316",
    border: "rgba(249,115,22,0.4)",
  },
  A4: {
    glow: "rgba(234,88,12,0.4)",
    glow2: "rgba(234,88,12,0.1)",
    text: "#ea580c",
    border: "rgba(234,88,12,0.35)",
  },
  A5: {
    glow: "rgba(194,65,12,0.4)",
    glow2: "rgba(194,65,12,0.1)",
    text: "#c2410c",
    border: "rgba(194,65,12,0.3)",
  },
  B1: {
    glow: "rgba(56,189,248,0.5)",
    glow2: "rgba(56,189,248,0.15)",
    text: "#38bdf8",
    border: "rgba(56,189,248,0.4)",
  },
  B2: {
    glow: "rgba(14,165,233,0.4)",
    glow2: "rgba(14,165,233,0.1)",
    text: "#0ea5e9",
    border: "rgba(14,165,233,0.35)",
  },
  B3: {
    glow: "rgba(59,130,246,0.4)",
    glow2: "rgba(59,130,246,0.1)",
    text: "#3b82f6",
    border: "rgba(59,130,246,0.3)",
  },
  B4: {
    glow: "rgba(99,102,241,0.3)",
    glow2: "rgba(99,102,241,0.08)",
    text: "#6366f1",
    border: "rgba(99,102,241,0.25)",
  },
  B5: {
    glow: "rgba(148,163,184,0.25)",
    glow2: "rgba(148,163,184,0.05)",
    text: "#94a3b8",
    border: "rgba(148,163,184,0.2)",
  },
};
