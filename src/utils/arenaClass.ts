import { ARENA_CLASS_COLORS, type ArenaClassColor } from "@/constants/iidx/arenaClassColors";

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
