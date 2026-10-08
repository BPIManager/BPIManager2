import { db } from "@/lib/db";
import { sql } from "kysely";
import { ARENA_RANK_ORDER } from "@/constants/iidx/arenaRanks";

import { logTotalBpiRepo } from "@/lib/db/domains/logs/totalBpi";
import type { TotalBpiVersionStats } from "@/types/siteStats";

import { latestPerUserAllVersionsSubquery as latestArenaStatsPerUserAllVersionsSubquery } from "@/lib/db/domains/arenaHistory";

const BPI_HISTOGRAM_MIN = -15;
const BPI_HISTOGRAM_MAX = 100;
const BPI_HISTOGRAM_BUCKET_SIZE = 5;
const BPI_HISTOGRAM_BUCKET_COUNT =
  (BPI_HISTOGRAM_MAX - BPI_HISTOGRAM_MIN) / BPI_HISTOGRAM_BUCKET_SIZE;

/**
 * サイト全体のバージョン別分布（アリーナランク・地域・スコア・総合BPIヒストグラム）を担当するリポジトリクラス。
 */
class SiteStatsDistributionRepository {
  /**
   * バージョンごとのアリーナランク別登録者数分布。
   */
  async getArenaRankDistributionByVersion() {
    const rows = await db
      .with("latest_per_user", () => latestArenaStatsPerUserAllVersionsSubquery())
      .selectFrom("officialArenaStats as oas")
      .innerJoin("latest_per_user as lpu", "lpu.maxId", "oas.id")
      .select(["oas.version", "oas.arenaClass", sql<number>`COUNT(*)`.as("count")])
      .groupBy(["oas.version", "oas.arenaClass"])
      .execute();

    const byVersion = new Map<string, Map<string, number>>();
    for (const r of rows) {
      if (!r.version) continue;
      const counts = byVersion.get(r.version) ?? new Map<string, number>();
      byVersion.set(r.version, counts);
      counts.set(r.arenaClass, (counts.get(r.arenaClass) ?? 0) + Number(r.count));
    }

    const result: Record<string, { rank: string; count: number }[]> = {};
    for (const [version, counts] of byVersion) {
      result[version] = (ARENA_RANK_ORDER as readonly string[]).map((r) => ({
        rank: r,
        count: counts.get(r) ?? 0,
      }));
    }
    return result;
  }

  /**
   * バージョンごとの県別利用者数分布。
   */
  async getAreaDistributionByVersion() {
    const rows = await db
      .with("latest_per_user", () => latestArenaStatsPerUserAllVersionsSubquery())
      .selectFrom("officialArenaStats as oas")
      .innerJoin("latest_per_user as lpu", "lpu.maxId", "oas.id")
      .where("oas.area", "is not", null)
      .select(["oas.version", "oas.area", sql<number>`COUNT(*)`.as("count")])
      .groupBy(["oas.version", "oas.area"])
      .execute();

    const byVersion = new Map<string, { area: string; count: number }[]>();
    for (const r of rows) {
      if (!r.version || r.area == null) continue;
      const list = byVersion.get(r.version) ?? [];
      byVersion.set(r.version, list);
      list.push({ area: r.area, count: Number(r.count) });
    }

    const result: Record<string, { area: string; count: number }[]> = {};
    for (const [version, list] of byVersion) {
      result[version] = list.sort((a, b) => b.count - a.count);
    }
    return result;
  }

  // bkScores・scores・allScores×allSongsを横断するバージョン別集計のため、直接参照を維持する。

  async getVersionScoreDistribution() {
    const BK_VERSIONS = ["26", "27", "28", "29", "30", "31", "32"] as const;
    const EXCLUDE_FROM_CURRENT = [...BK_VERSIONS, "INF"];

    const [bkRows, scoresRows, allScoresRows] = await Promise.all([
      db
        .selectFrom("bkScores")
        .select(["version", sql<number>`COUNT(*)`.as("count")])
        .where("version", "in", BK_VERSIONS)
        .groupBy("version")
        .execute(),

      db
        .selectFrom("scores")
        .select(["version", sql<number>`COUNT(*)`.as("count")])
        .where("version", "not in", EXCLUDE_FROM_CURRENT)
        .groupBy("version")
        .execute(),

      db
        .selectFrom("allScores as s")
        .innerJoin("allSongs as sg", "sg.songId", "s.songId")
        .select(["s.version", sql<number>`COUNT(*)`.as("count")])
        .where("sg.difficultyLevel", "not in", [11, 12])
        .where("s.version", "not in", EXCLUDE_FROM_CURRENT)
        .groupBy("s.version")
        .execute(),
    ]);

    const map = new Map<string, number>();
    const add = (v: string | null | undefined, n: number) => {
      if (!v) return;
      map.set(v, (map.get(v) ?? 0) + n);
    };
    bkRows.forEach((r) => add(r.version, Number(r.count)));
    scoresRows.forEach((r) => add(r.version, Number(r.count)));
    allScoresRows.forEach((r) => add(r.version, Number(r.count)));

    const bkSet = new Set<string>(BK_VERSIONS);
    const others = [...map.keys()]
      .filter((v) => !bkSet.has(v) && v !== "INF")
      .sort((a, b) => Number(a) - Number(b));
    const ordered = [...BK_VERSIONS, ...others];

    const versions = ordered.map((v) => ({
      version: v,
      count: map.get(v) ?? 0,
    }));
    const total = versions.reduce((s, r) => s + r.count, 0);
    return { versions, total };
  }

  /**
   * バージョンごとの総合BPIレンジ別（5刻み・-15〜100の23バケット）のユーザー数分布。ダッシュボードと同じ正本（logs の現在の総合BPI）を使う。
   */
  async getTotalBpiHistogramByVersion() {
    const rows = await logTotalBpiRepo.getLatestTotalBpiPerUserAllVersions();

    const byVersion = new Map<string, number[]>();
    for (const r of rows) {
      if (r.totalBpi == null || !r.version) continue;
      const counts =
        byVersion.get(r.version) ?? new Array(BPI_HISTOGRAM_BUCKET_COUNT).fill(0);
      byVersion.set(r.version, counts);
      const idx = Math.min(
        BPI_HISTOGRAM_BUCKET_COUNT - 1,
        Math.max(
          0,
          Math.floor((Number(r.totalBpi) - BPI_HISTOGRAM_MIN) / BPI_HISTOGRAM_BUCKET_SIZE),
        ),
      );
      counts[idx]++;
    }

    const result: Record<string, { bucketStart: number; bucketEnd: number; count: number }[]> =
      {};
    for (const [version, counts] of byVersion) {
      result[version] = counts.map((count, i) => ({
        bucketStart: BPI_HISTOGRAM_MIN + i * BPI_HISTOGRAM_BUCKET_SIZE,
        bucketEnd: BPI_HISTOGRAM_MIN + (i + 1) * BPI_HISTOGRAM_BUCKET_SIZE,
        count,
      }));
    }
    return result;
  }

  /**
   * バージョンごとの総合BPI統計（人数・平均・中央値・最大/最小・四分位等）。ヒストグラムと同じ正本を使う。
   */
  async getTotalBpiStatsByVersion(): Promise<TotalBpiVersionStats[]> {
    const rows = await logTotalBpiRepo.getLatestTotalBpiPerUserAllVersions();

    const byVersion = new Map<string, number[]>();
    for (const r of rows) {
      if (r.totalBpi == null || !r.version) continue;
      const list = byVersion.get(r.version) ?? [];
      byVersion.set(r.version, list);
      list.push(Number(r.totalBpi));
    }

    // 線形補間によるパーセンタイル（sorted は昇順）
    const percentile = (sorted: number[], p: number) => {
      const pos = (sorted.length - 1) * p;
      const lo = Math.floor(pos);
      const hi = Math.ceil(pos);
      return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
    };

    return [...byVersion.entries()]
      .map(([version, values]) => {
        const sorted = [...values].sort((a, b) => a - b);
        return {
          version,
          userCount: sorted.length,
          mean: sorted.reduce((s, v) => s + v, 0) / sorted.length,
          median: percentile(sorted, 0.5),
          max: sorted[sorted.length - 1],
          min: sorted[0],
          p25: percentile(sorted, 0.25),
          p75: percentile(sorted, 0.75),
          p90: percentile(sorted, 0.9),
        };
      })
      .sort((a, b) => Number(b.version) - Number(a.version));
  }
}

export const siteStatsDistributionRepo = new SiteStatsDistributionRepository();
