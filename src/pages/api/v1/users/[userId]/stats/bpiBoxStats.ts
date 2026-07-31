import { statsChartsRepo } from "@/lib/db/aggregates/stats/charts";
import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { parseStatsQuery } from "@/services/nextRequest/parseStatsQueries";
import type { StatsGroupBy } from "@/types/stats/bpiBoxStats";
import dayjs from "@/lib/dayjs";
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

export default withUserApiHandler(
  (req, res) => {
    const query = parseStatsQuery(req.query, res);
    if (!query) return null;
    if (query.levels.length === 0 && query.difficulties.length === 0) {
      res.status(400).json({ message: "Required parameters are missing" });
      return null;
    }
    return query;
  },
  async (req, res, { userId, version, levels, difficulties }) => {
    const groupBy = (req.query.groupBy as StatsGroupBy) || "day";

    const { scores, tower } = await statsChartsRepo.getBpiAndVolumePerDate(
      userId,
      version,
      levels,
      difficulties,
    );

    const groupedTower = new Map<string, number>();
    for (const t of tower) {
      const d = dayjs(t.date);
      const dateKey =
        groupBy === "month"
          ? d.format("YYYY-MM")
          : groupBy === "week"
            ? d.startOf("week").format("YYYY-MM-DD")
            : d.format("YYYY-MM-DD");

      const count = Number(t.keyCount) + Number(t.scratchCount);
      groupedTower.set(dateKey, (groupedTower.get(dateKey) || 0) + count);
    }

    const grouped = new Map<
      string,
      { bpiMap: Map<number, number>; notesMap: Map<number, number> }
    >();

    for (const row of scores) {
      const d = dayjs(row.date);
      const dateKey =
        groupBy === "month"
          ? d.format("YYYY-MM")
          : groupBy === "week"
            ? d.startOf("week").format("YYYY-MM-DD")
            : d.format("YYYY-MM-DD");

      const current = grouped.get(dateKey) ?? {
        bpiMap: new Map(),
        notesMap: new Map(),
      };

      const songId = Number(row.songId);
      const bpi = Number(row.bpi);
      const notes = Number(row.notes);

      if (!current.bpiMap.has(songId) || current.bpiMap.get(songId)! < bpi) {
        current.bpiMap.set(songId, bpi);
        current.notesMap.set(songId, notes);
      }
      grouped.set(dateKey, current);
    }

    const result = [];
    for (const [date, data] of grouped.entries()) {
      const bpis = Array.from(data.bpiMap.values());
      const sorted = bpis.sort((a, b) => a - b);
      const count = sorted.length;
      const registeredNotes = Array.from(data.notesMap.values()).reduce(
        (a, b) => a + b,
        0,
      );

      const totalPhysicalNotes = groupedTower.get(date) || 0;

      const efficiency =
        totalPhysicalNotes > 0 ? registeredNotes / totalPhysicalNotes : 0;

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
        totalBpiTop75: BpiCalculator.calculateTotalBPI(top75, top75.length),
        totalBpiTop25: BpiCalculator.calculateTotalBPI(top25, top25.length),
        totalPhysicalNotes,
        registeredNotes,
        efficiency: Math.min(efficiency * 100, 100),
      });
    }

    result.sort((a, b) => a.date.localeCompare(b.date));
    return res.status(200).json(result);
  },
  {
    onError: (error, res) => {
      const message = error instanceof Error ? error.message : "Unknown error";
      return res.status(500).json({ message });
    },
  },
);
