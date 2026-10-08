import type { TopRankerAreaCount } from "@/lib/db/domains/topRankers";

export interface AreaSummaryRow {
  areaId: number;
  total: number;
  bestVersion: string;
  bestCount: number;
  /** バージョンごとの件数（1位が無いバージョンはキー自体が無い） */
  byVersion: Record<string, number>;
}

/** バージョン×エリアの件数を、エリアごとの累計と最多バージョンに畳む（累計の多い順） */
export function summarizeByArea(counts: TopRankerAreaCount[]): AreaSummaryRow[] {
  const byArea = new Map<number, AreaSummaryRow>();
  for (const c of counts) {
    const row = byArea.get(c.areaId) ?? {
      areaId: c.areaId,
      total: 0,
      bestVersion: c.version,
      bestCount: 0,
      byVersion: {},
    };
    row.total += c.count;
    row.byVersion[c.version] = (row.byVersion[c.version] ?? 0) + c.count;
    if (c.count > row.bestCount) {
      row.bestVersion = c.version;
      row.bestCount = c.count;
    }
    byArea.set(c.areaId, row);
  }
  return [...byArea.values()].sort((a, b) => b.total - a.total);
}
