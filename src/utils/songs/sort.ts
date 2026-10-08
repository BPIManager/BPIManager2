import {
  FilterParamsFrontend,
  RivalScore,
  SongForSort,
  SongWithRival,
  SongWithScore,
  TargetComparison,
} from "@/types/songs/score";
import { getMaxBpm } from "./getMaxBPM";

/** `<key>#<index>` 形式のソートキーを基底キーとターゲットindexに分解する */
const parseSortKey = (sortKey: string): [string, number] => {
  const [base, idx] = sortKey.split("#");
  return [base, idx === undefined ? 0 : Number(idx)];
};

/** 指定indexのターゲット比較結果を取り出す（index 0 は従来の rival/exDiff/bpiDiff） */
const targetOf = (s: SongForSort, index: number): TargetComparison => {
  if (index === 0) {
    return { rival: s.rival ?? null, exDiff: s.exDiff, bpiDiff: s.bpiDiff };
  }
  return (s as SongWithRival).targets?.[index] ?? { rival: null };
};

export const sortSongs = (
  songs: SongWithScore[],
  p: FilterParamsFrontend,
): SongWithScore[] => {
  const { sortKey: rawSortKey = "level", sortOrder = "desc", search } = p;
  const [sortKey, targetIndex] = parseSortKey(rawSortKey);
  const isAsc = sortOrder === "asc";

  const getRate = (ex: number | null | undefined, notes: number) => {
    if (ex === null || ex === undefined || !notes) return -1;
    return ex / (notes * 2);
  };

  return [...songs].sort((a: SongForSort, b: SongForSort) => {
    if (search) {
      const searchLower = search.toLowerCase();
      const getWeight = (t: string) =>
        t.toLowerCase() === searchLower
          ? 0
          : t.toLowerCase().startsWith(searchLower)
            ? 1
            : 2;
      const diff = getWeight(a.title) - getWeight(b.title);
      if (diff !== 0) return diff;
    }

    let vA: number | string, vB: number | string;

    switch (sortKey) {
      case "rivalBpi":
        vA = (targetOf(a, targetIndex).rival as RivalScore | null)?.bpi ?? -15;
        vB = (targetOf(b, targetIndex).rival as RivalScore | null)?.bpi ?? -15;
        break;
      case "myBpi":
      case "bpi":
        vA = a.bpi ?? -15;
        vB = b.bpi ?? -15;
        break;
      case "rivalRate":
        vA = getRate(targetOf(a, targetIndex).rival?.exScore, a.notes);
        vB = getRate(targetOf(b, targetIndex).rival?.exScore, b.notes);
        break;
      case "myRate":
      case "scoreRate":
        vA = getRate(a.exScore, a.notes);
        vB = getRate(b.exScore, b.notes);
        break;
      case "exScore":
        vA = a.exScore ?? -1;
        vB = b.exScore ?? -1;
        break;
      // 自分−ライバルの符号付き差。降順=自分が大きく勝っている順、昇順=ライバルが大きく勝っている順
      case "exGap":
        vA = targetOf(a, targetIndex).exDiff ?? Number.NEGATIVE_INFINITY;
        vB = targetOf(b, targetIndex).exDiff ?? Number.NEGATIVE_INFINITY;
        break;

      case "bpiGap":
        vA = targetOf(a, targetIndex).bpiDiff ?? Number.NEGATIVE_INFINITY;
        vB = targetOf(b, targetIndex).bpiDiff ?? Number.NEGATIVE_INFINITY;
        break;

      case "rivalUpdated":
        {
          const lpA = targetOf(a, targetIndex).rival?.lastPlayed;
          const lpB = targetOf(b, targetIndex).rival?.lastPlayed;
          vA = lpA ? new Date(lpA).getTime() : 0;
          vB = lpB ? new Date(lpB).getTime() : 0;
        }
        break;
      case "myUpdated":
        vA = a.scoreAt ? new Date(a.scoreAt).getTime() : 0;
        vB = b.scoreAt ? new Date(b.scoreAt).getTime() : 0;
        break;
      case "updatedAt":
        vA = new Date(a.lastPlayedMax || a.scoreAt || 0).getTime();
        vB = new Date(b.lastPlayedMax || b.scoreAt || 0).getTime();
        break;
      case "bpm":
        vA = getMaxBpm(a.bpm);
        vB = getMaxBpm(b.bpm);
        break;
      case "notes":
        vA = a.notes;
        vB = b.notes;
        break;
      case "title":
        vA = a.title;
        vB = b.title;
        break;
      case "version":
        vA = a.releasedVersion ?? 0;
        vB = b.releasedVersion ?? 0;
        break;
      default:
        vA = a.difficultyLevel;
        vB = b.difficultyLevel;
    }

    if (vA < vB) return isAsc ? -1 : 1;
    if (vA > vB) return isAsc ? 1 : -1;

    if (a.difficultyLevel !== b.difficultyLevel) {
      return b.difficultyLevel - a.difficultyLevel;
    }
    return a.title.localeCompare(b.title);
  });
};
