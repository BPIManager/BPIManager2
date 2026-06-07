import { ARENA_RANK_ORDER } from "@/constants/arenaRanks";
import type { MonthlyArena } from "@/types/stats/monthlyReview";

type ArenaRow = {
  arenaClass: string;
  arenaRank: number | null;
  a1continue: unknown;
};

export function buildArena(arenaRows: ArenaRow[]): MonthlyArena | null {
  if (arenaRows.length === 0) return null;

  const order = ARENA_RANK_ORDER as readonly string[];
  let bestClassIdx = Infinity;
  let bestClass = arenaRows[0].arenaClass;
  let bestRank: number | null = null;
  let maxA1Continue: number | null = null;

  for (const row of arenaRows) {
    const idx = order.indexOf(row.arenaClass);
    if (idx < bestClassIdx) {
      bestClassIdx = idx;
      bestClass = row.arenaClass;
      bestRank = row.arenaRank;
    }
    const a1c = row.a1continue != null ? Number(row.a1continue) : null;
    if (a1c != null && (maxA1Continue == null || a1c > maxA1Continue)) {
      maxA1Continue = a1c;
    }
  }

  return { bestClass, bestRank, maxA1Continue };
}
