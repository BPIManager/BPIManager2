const COLOR_MAP: Record<string, string> = {
  HYPER: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  ANOTHER: "bg-red-500/20 text-red-400 border-red-500/30",
  LEGGENDARIA: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

interface DifficultyBadgeProps {
  difficulty: string;
  level: number;
  size?: "sm" | "md";
  truncate?: boolean;
}

export function DifficultyBadge({
  difficulty,
  level,
  size = "sm",
  truncate = true,
}: DifficultyBadgeProps) {
  const color =
    COLOR_MAP[difficulty] ??
    "bg-bpim-overlay text-bpim-muted border-bpim-border";
  const sizeClass =
    size === "md"
      ? "text-xs px-2 py-0.5 gap-1"
      : "text-[10px] px-1.5 py-0.5 gap-1";
  return (
    <span
      className={`inline-flex items-center rounded font-bold border ${sizeClass} ${color}`}
    >
      ☆{level} {difficulty}
    </span>
  );
}
