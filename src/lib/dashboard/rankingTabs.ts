import type { RankingTabSetting, SavedComparison } from "@/types/analytics/saved";

export const BUILTIN_RANKING_TABS = ["weapons", "potential", "nearLose"] as const;
export type BuiltinRankingTab = (typeof BUILTIN_RANKING_TABS)[number];

export const SAVED_TAB_PREFIX = "saved:";

export const isSavedTabKey = (key: string) => key.startsWith(SAVED_TAB_PREFIX);
export const savedTabId = (key: string) => Number(key.slice(SAVED_TAB_PREFIX.length));
export const toSavedTabKey = (id: number) => `${SAVED_TAB_PREFIX}${id}`;

export interface RankingTabEntry {
  key: string;
  visible: boolean;
  /** 保存済み比較タブのみ。複数ターゲットのうちダッシュボードに出すもの */
  targetIndex: number;
  /** 保存済み比較タブのみ */
  comparison?: SavedComparison;
}

/**
 * サーバー保存済みの設定と保存済み比較一覧から、表示順のタブ一覧を作る。
 * 設定の無い組み込みタブは既定で表示、未設定の保存済み比較は既定で非表示にして末尾へ足す（既存の見た目を変えないため）。
 * 削除済みの保存済み比較を指す設定は捨てる。
 */
export function mergeRankingTabs(
  settings: RankingTabSetting[],
  comparisons: SavedComparison[],
): RankingTabEntry[] {
  const byId = new Map(comparisons.map((c) => [c.id, c]));
  const seen = new Set<string>();
  const entries: RankingTabEntry[] = [];

  for (const s of settings) {
    if (seen.has(s.key)) continue;
    if (isSavedTabKey(s.key)) {
      const comparison = byId.get(savedTabId(s.key));
      if (!comparison) continue;
      const maxIndex = Math.max(comparison.targets.length - 1, 0);
      entries.push({
        key: s.key,
        visible: s.visible,
        targetIndex: Math.min(s.targetIndex ?? 0, maxIndex),
        comparison,
      });
    } else if ((BUILTIN_RANKING_TABS as readonly string[]).includes(s.key)) {
      entries.push({ key: s.key, visible: s.visible, targetIndex: 0 });
    } else {
      continue;
    }
    seen.add(s.key);
  }

  for (const key of BUILTIN_RANKING_TABS) {
    if (!seen.has(key)) entries.push({ key, visible: true, targetIndex: 0 });
  }
  for (const comparison of comparisons) {
    const key = toSavedTabKey(comparison.id);
    if (!seen.has(key)) {
      entries.push({ key, visible: false, targetIndex: 0, comparison });
    }
  }
  return entries;
}

/** 設定ダイアログの編集結果をサーバーへ送る形式に変換する */
export function toTabSettings(entries: RankingTabEntry[]): RankingTabSetting[] {
  return entries.map((e) => ({
    key: e.key,
    visible: e.visible,
    ...(isSavedTabKey(e.key) ? { targetIndex: e.targetIndex } : {}),
  }));
}

export interface BehindSong {
  songId: number;
  /** 比較対象まであと何点か（正の値） */
  remaining: number;
}

/**
 * 比較対象に負けている譜面を、差が小さい順に並べる。比較対象のスコアが無い・自分が勝っている譜面は除く。
 *
 * @param songs - exDiff（自分 − 比較対象）を持つ比較結果
 */
export function pickBehindSongs<T extends { exDiff?: number }>(
  songs: T[],
): (T & { remaining: number })[] {
  return songs
    .filter((s): s is T & { exDiff: number } => typeof s.exDiff === "number" && s.exDiff < 0)
    .map((s) => ({ ...s, remaining: -s.exDiff }))
    .sort((a, b) => a.remaining - b.remaining);
}
