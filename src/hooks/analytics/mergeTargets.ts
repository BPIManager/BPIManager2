import type {
  RivalScore,
  SongWithRival,
  TargetComparison,
} from "@/types/songs/score";

const EMPTY_RIVAL: RivalScore = {
  exScore: null,
  bpi: null,
  clearState: null,
  missCount: null,
  lastPlayed: null,
};

const songKey = (s: { songId: number; difficulty: string }) =>
  `${s.songId}__${s.difficulty}`;

/**
 * 比較ターゲットごとの結果（自分の行にそのターゲットのスコアを載せたもの）を、1譜面1行にまとめる。
 * 先頭ターゲットは従来どおり`rival`/`exDiff`/`bpiDiff`に載り、全ターゲット分は`targets`に並ぶ。
 * 譜面の並びは先頭ターゲットの行 → 2件目以降にだけある行の順。
 */
export function mergeTargetSongs(
  perTarget: (SongWithRival[] | undefined)[],
): SongWithRival[] {
  const merged = new Map<string, SongWithRival>();

  perTarget.forEach((songs, index) => {
    for (const s of songs ?? []) {
      const key = songKey(s);
      let row = merged.get(key);
      if (!row) {
        row = {
          ...s,
          rival: EMPTY_RIVAL,
          exDiff: undefined,
          bpiDiff: undefined,
          targets: perTarget.map(
            (): TargetComparison => ({ rival: null }),
          ),
        };
        merged.set(key, row);
      }
      const comparison: TargetComparison = {
        rival: s.rival ?? null,
        exDiff: s.exDiff,
        bpiDiff: s.bpiDiff,
      };
      row.targets![index] = comparison;
      if (index === 0) {
        row.rival = s.rival ?? EMPTY_RIVAL;
        row.exDiff = s.exDiff;
        row.bpiDiff = s.bpiDiff;
      }
    }
  });

  return [...merged.values()];
}
