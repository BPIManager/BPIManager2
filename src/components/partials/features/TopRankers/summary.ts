import type { TopRankerAreaCount } from "@/lib/db/aggregates/topRankers/summary";

/** 件数の内訳（レベル別・難易度別） */
export interface CountBreakdown {
  byLevel: Record<number, number>;
  byDifficulty: Record<string, number>;
}

export interface AreaSummaryRow {
  areaId: number;
  total: number;
  bestVersion: string;
  bestCount: number;
  /** バージョンごとの件数（1位が無いバージョンはキー自体が無い） */
  byVersion: Record<string, number>;
  /** 全バージョン合算の内訳 */
  breakdown: CountBreakdown;
  /** バージョンごとの内訳 */
  breakdownByVersion: Record<string, CountBreakdown>;
}

const emptyBreakdown = (): CountBreakdown => ({
  byLevel: {},
  byDifficulty: {},
});

const addTo = (b: CountBreakdown, c: TopRankerAreaCount) => {
  b.byLevel[c.difficultyLevel] = (b.byLevel[c.difficultyLevel] ?? 0) + c.count;
  b.byDifficulty[c.difficulty] = (b.byDifficulty[c.difficulty] ?? 0) + c.count;
};

/** バージョン×エリア×難易度×レベルの件数を、エリアごとの累計・最多バージョン・内訳に畳む（累計の多い順） */
export function summarizeByArea(counts: TopRankerAreaCount[]): AreaSummaryRow[] {
  const byArea = new Map<number, AreaSummaryRow>();
  for (const c of counts) {
    const row = byArea.get(c.areaId) ?? {
      areaId: c.areaId,
      total: 0,
      bestVersion: c.version,
      bestCount: 0,
      byVersion: {},
      breakdown: emptyBreakdown(),
      breakdownByVersion: {},
    };
    row.total += c.count;
    row.byVersion[c.version] = (row.byVersion[c.version] ?? 0) + c.count;
    addTo(row.breakdown, c);
    addTo((row.breakdownByVersion[c.version] ??= emptyBreakdown()), c);
    byArea.set(c.areaId, row);
  }
  // 最多バージョンは、全行を畳んだあとのバージョン別合計から決める
  for (const row of byArea.values()) {
    for (const [version, count] of Object.entries(row.byVersion)) {
      if (count > row.bestCount) {
        row.bestVersion = version;
        row.bestCount = count;
      }
    }
  }
  return [...byArea.values()].sort((a, b) => b.total - a.total);
}

export interface VersionArea {
  areaId: number;
  count: number;
}

/** 指定バージョンで1位を獲得しているエリアと件数（件数の多い順、同数ならエリアIDの小さい順） */
export function areasInVersion(
  counts: TopRankerAreaCount[],
  version: string,
): VersionArea[] {
  const byArea = new Map<number, number>();
  for (const c of counts) {
    if (c.version === version) {
      byArea.set(c.areaId, (byArea.get(c.areaId) ?? 0) + c.count);
    }
  }
  return [...byArea.entries()]
    .map(([areaId, count]) => ({ areaId, count }))
    .sort((a, b) => b.count - a.count || a.areaId - b.areaId);
}
