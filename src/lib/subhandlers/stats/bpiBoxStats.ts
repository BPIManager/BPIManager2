import type { NextApiRequest } from "next";
import { BpiV1 } from "@bpim/bpicalc";
import dayjs from "@/lib/dayjs";
import { statsChartsRepo } from "@/lib/db/aggregates/stats/charts";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { groupByOf, percentile } from "./_shared";
import type { StatsQuery } from "@/types/stats/query";
import type { HandlerResult } from "@/types/api";

/** 日付グループ内の1曲ぶん（その時点までのベストexScore時点の値）。 */
interface BoxStatsSong {
  songId: number;
  notes: number;
  kaidenAvg: number | null;
  wrScore: number | null;
  coef: number | null;
  bpi: number;
  exScore: number;
}

// mu/sigma(V2)を必要としないV1で統一する。top75/top25のような曲の部分
// 集合に対してmu/sigma依存のシフト法(潜在スキル推定)を使うと、集合が
// 偏っているほど推定が歪み、上位%総合が意図通りの値にならないため。
const legacyV1 = new BpiV1();

/**
 * 曲の部分集合に対する総合BPI(V1)。この集合を丸ごと1つの「対象楽曲」として
 * 扱う（top75/top25のような固定集合の総合値で、未プレイ曲の穴埋めは無い）。
 */
function totalOf(songs: BoxStatsSong[]): number {
  const bpisDesc = songs
    .map((s) => s.bpi)
    .sort((a, b) => b - a);
  if (bpisDesc.length === 0) return -15;
  return legacyV1.total(bpisDesc, bpisDesc.length);
}

export async function handleStatsBpiBoxStats(
  q: StatsQuery,
  req: NextApiRequest,
): Promise<HandlerResult<unknown>> {
  try {
    const groupBy = groupByOf(req);
    const { scores, tower } = await statsChartsRepo.getBpiAndVolumePerDate(
      q.userId,
      q.version,
      q.levels,
      q.difficulties,
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

    const grouped = new Map<string, Map<number, BoxStatsSong>>();
    for (const row of scores) {
      const d = dayjs(row.date);
      const dateKey =
        groupBy === "month"
          ? d.format("YYYY-MM")
          : groupBy === "week"
            ? d.startOf("week").format("YYYY-MM-DD")
            : d.format("YYYY-MM-DD");
      const current = grouped.get(dateKey) ?? new Map<number, BoxStatsSong>();
      const songId = Number(row.songId);
      const notes = Number(row.notes);
      const exScore = Number(row.exScore);
      const bpi = legacyV1
        .chart({
          notes,
          kaidenAvg: row.kaidenAvg,
          wrScore: row.wrScore,
          coef: row.coef,
        })
        .bpi(exScore);
      if (bpi === null) continue;
      const existing = current.get(songId);
      if (!existing || existing.bpi < bpi) {
        current.set(songId, {
          songId,
          bpi,
          notes,
          exScore,
          kaidenAvg: row.kaidenAvg,
          wrScore: row.wrScore,
          coef: row.coef,
        });
      }
      grouped.set(dateKey, current);
    }

    const result = [];
    for (const [date, songMap] of grouped.entries()) {
      const songs = Array.from(songMap.values()).sort((a, b) => a.bpi - b.bpi);
      const sorted = songs.map((s) => s.bpi);
      const count = songs.length;
      const registeredNotes = songs.reduce((a, s) => a + s.notes, 0);
      const totalPhysicalNotes = groupedTower.get(date) || 0;
      // 段位(iidxTower)データが同期されていない日はtotalPhysicalNotes=0になり、
      // 「効率0%」と「未計測」を区別できなくなる。前者は実際に何も打鍵していない
      // ことを意味してしまうため、未計測の場合はnullにしてグラフ上は欠測として扱う
      const efficiency =
        totalPhysicalNotes > 0
          ? Math.min((registeredNotes / totalPhysicalNotes) * 100, 100)
          : null;
      const top75 = songs.slice(Math.floor(count * 0.25));
      const top25 = songs.slice(Math.floor(count * 0.75));
      result.push({
        date,
        min: sorted[0],
        max: sorted[count - 1],
        median: percentile(sorted, 50),
        p25: percentile(sorted, 25),
        p75: percentile(sorted, 75),
        count,
        totalBpi: totalOf(songs),
        totalBpiTop75: totalOf(top75),
        totalBpiTop25: totalOf(top25),
        totalPhysicalNotes,
        registeredNotes,
        efficiency,
      });
    }
    result.sort((a, b) => a.date.localeCompare(b.date));
    return ok(result);
  } catch (error) {
    return err(500, toErrorMessage(error));
  }
}
