import fs from "fs/promises";
import path from "path";
import { getArenaStatsHistory } from "@/lib/db/domains/arenaHistory";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import type { HandlerResult } from "@/types/api";

export async function handleStatsArenaHistory(q: {
  userId: string;
  version: string;
  startDate: Date;
  endDate: Date;
}): Promise<HandlerResult<unknown>> {
  try {
    const rows = await getArenaStatsHistory(
      q.userId,
      q.version,
      q.startDate,
      q.endDate,
    );
    const classOffsets = new Map<string, number>();
    try {
      const distPath = path.join(
        process.cwd(),
        `public/data/info/arena_official/${q.version}/latest.json`,
      );
      const dist = JSON.parse(await fs.readFile(distPath, "utf-8")) as {
        distribution: { rank: string; count: number }[];
      };
      let cumulative = 0;
      for (const { rank: cls, count } of dist.distribution) {
        classOffsets.set(cls, cumulative);
        cumulative += count;
      }
    } catch {}

    const result = rows.map((r) => ({
      fetchedAt: r.fetchedAt,
      arenaClass: r.arenaClass,
      arenaRank: r.arenaRank,
      wins: r.wins,
      a1continue: r.a1continue,
      classRank: r.arenaRank,
      globalRank:
        r.arenaRank !== null
          ? (classOffsets.get(r.arenaClass) ?? 0) + r.arenaRank
          : null,
    }));
    return ok(result);
  } catch (error) {
    return err(500, toErrorMessage(error));
  }
}

/** GET stats/available-periods */
