import type { RivalSortKey } from "@/types/songs/score";

/** ソートオプション定数（ドロップダウン用） */
export const rivalSortOptions = [
  { label: "ライバルのBPI", value: "rivalBpi" },
  { label: "自分のBPI", value: "myBpi" },
  { label: "ライバルのスコアレート", value: "rivalRate" },
  { label: "自分のスコアレート", value: "myRate" },
  { label: "EX差", value: "exGap" },
  { label: "BPI差", value: "bpiGap" },
  { label: "ライバルの更新時間", value: "rivalUpdated" },
  { label: "自分の更新時間", value: "myUpdated" },
];

/** 比較ターゲットごとに選択肢を増やすソートキー（2件目以降は`<key>#<index>`） */
export const PER_TARGET_SORT_KEYS: readonly RivalSortKey[] = [
  "rivalBpi",
  "rivalRate",
  "exGap",
  "bpiGap",
  "rivalUpdated",
];

export const soleSortOptions = [
  { label: "BPI", value: "bpi" },
  { label: "EXスコア", value: "exScore" },
  { label: "最終更新", value: "updatedAt" },
];

export const scoreRateSortOption = { label: "スコアレート", value: "scoreRate" };

export const sortOptions = [
  { label: "レベル", value: "level" },
  { label: "楽曲名", value: "title" },
  { label: "BPM", value: "bpm" },
  { label: "ノーツ数", value: "notes" },
  { label: "収録バージョン", value: "version" },
];

export const sortOrderOptions = [
  { label: "降順", value: "desc" },
  { label: "昇順", value: "asc" },
];
