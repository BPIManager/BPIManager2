type ArenaClassColor = {
  bg: string;
  text: string;
  border: string;
  glow: string;
};

const ARENA_CLASS_COLORS: Record<string, ArenaClassColor> = {
  A1: {
    bg: "#fbbf2420",
    text: "#fbbf24",
    border: "#fbbf2450",
    glow: "#fbbf2430",
  },
  A2: {
    bg: "#f59e0b20",
    text: "#f59e0b",
    border: "#f59e0b50",
    glow: "#f59e0b28",
  },
  A3: {
    bg: "#fb923c20",
    text: "#fb923c",
    border: "#fb923c50",
    glow: "#fb923c28",
  },
  A4: {
    bg: "#f9731620",
    text: "#f97316",
    border: "#f9731650",
    glow: "#f9731628",
  },
  A5: {
    bg: "#ef444420",
    text: "#ef4444",
    border: "#ef444450",
    glow: "#ef444428",
  },
  B1: {
    bg: "#22d3ee20",
    text: "#22d3ee",
    border: "#22d3ee50",
    glow: "#22d3ee28",
  },
  B2: {
    bg: "#38bdf820",
    text: "#38bdf8",
    border: "#38bdf850",
    glow: "#38bdf828",
  },
  B3: {
    bg: "#60a5fa20",
    text: "#60a5fa",
    border: "#60a5fa50",
    glow: "#60a5fa28",
  },
  B4: {
    bg: "#818cf820",
    text: "#818cf8",
    border: "#818cf850",
    glow: "#818cf828",
  },
  B5: {
    bg: "#a78bfa20",
    text: "#a78bfa",
    border: "#a78bfa50",
    glow: "#a78bfa28",
  },
};

const DEFAULT_COLOR: ArenaClassColor = {
  bg: "#6b728020",
  text: "#9ca3af",
  border: "#6b728050",
  glow: "#6b728028",
};

export function getArenaClassColor(
  arenaClass: string | null | undefined,
): ArenaClassColor {
  if (
    !arenaClass ||
    !Object.keys(ARENA_CLASS_COLORS).find((item) => item === arenaClass)
  )
    return DEFAULT_COLOR;
  return ARENA_CLASS_COLORS[arenaClass] ?? DEFAULT_COLOR;
}
