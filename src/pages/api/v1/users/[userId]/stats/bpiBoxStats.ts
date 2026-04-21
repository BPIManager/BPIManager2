import { statsRepo } from "@/lib/db/stats";
import { checkUserAccess, rejectAccess } from "@/middlewares/api/withApi";
import { parseStatsQuery } from "@/services/nextRequest/parseStatsQueries";
import type { BpiBoxStatsItem, StatsGroupBy } from "@/types/stats/bpiBoxStats";
import dayjs from "@/lib/dayjs";
import { NextApiRequest, NextApiResponse } from "next";
import { BpiCalculator } from "@/lib/bpi";

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const query = parseStatsQuery(req.query, res);
  if (!query) return;
  const { userId, version, levels, difficulties } = query;
  const groupBy = (req.query.groupBy as StatsGroupBy) || "day";

  if (levels.length === 0 && difficulties.length === 0) {
    return res.status(400).json({ message: "Required parameters are missing" });
  }

  try {
    const access = await checkUserAccess(req, userId);
    if (!access.hasAccess) return rejectAccess(res, access);

    const rows = await statsRepo.getBpiPerDateRaw(
      userId,
      version,
      levels,
      difficulties,
    );

    const grouped = new Map<string, number[]>();
    for (const row of rows) {
      if (row.bpi === null || row.bpi === undefined) continue;
      const bpi = Number(row.bpi);
      if (!isFinite(bpi)) continue;
      const d = dayjs(row.date);
      let dateKey: string;
      if (groupBy === "month") {
        dateKey = d.format("YYYY-MM");
      } else if (groupBy === "week") {
        const dow = d.day();
        const mondayOffset = dow === 0 ? -6 : 1 - dow;
        dateKey = d.add(mondayOffset, "day").format("YYYY-MM-DD");
      } else {
        dateKey = d.format("YYYY-MM-DD");
      }
      const arr = grouped.get(dateKey) ?? [];
      arr.push(bpi);
      grouped.set(dateKey, arr);
    }

    const result: BpiBoxStatsItem[] = [];
    for (const [date, bpis] of grouped.entries()) {
      const sorted = [...bpis].sort((a, b) => a - b);
      const count = sorted.length;
      const top75 = sorted.slice(Math.floor(count * 0.25));
      const top25 = sorted.slice(Math.floor(count * 0.75));
      result.push({
        date,
        min: sorted[0],
        max: sorted[count - 1],
        median: percentile(sorted, 50),
        p25: percentile(sorted, 25),
        p75: percentile(sorted, 75),
        count,
        totalBpi: BpiCalculator.calculateTotalBPI(sorted, count),
        totalBpiTop75: BpiCalculator.calculateTotalBPI(top75, count),
        totalBpiTop25: BpiCalculator.calculateTotalBPI(top25, count),
      });
    }

    result.sort((a, b) => a.date.localeCompare(b.date));

    return res.status(200).json(result);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ message: errorMessage });
  }
}
