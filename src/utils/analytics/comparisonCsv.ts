import type { SongWithRival, TargetComparison } from "@/types/songs/score";

const escapeCsv = (v: string | number | null | undefined): string => {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const num = (v: number | null | undefined, digits?: number): string => {
  if (v === null || v === undefined || !Number.isFinite(v)) return "";
  return digits === undefined ? String(v) : v.toFixed(digits);
};

/** 複数ターゲット時は`targets`、1件のときは従来の`rival`/`exDiff`/`bpiDiff`から1ターゲット分の比較結果を取り出す */
const comparisonsOf = (song: SongWithRival, count: number): TargetComparison[] =>
  song.targets && count > 1
    ? song.targets
    : [{ rival: song.rival, exDiff: song.exDiff, bpiDiff: song.bpiDiff }];

/**
 * 比較ページの一覧をCSV文字列にする。
 * 列は 曲名・難易度・レベル・ノーツ数・自分のEX/BPI のあと、ターゲットごとに EX / BPI / EX差 / BPI差 が並ぶ（差は自分−ターゲット）。
 *
 * @param songs - 出力する行（絞り込み・並び替え済みの全件）
 * @param labels - 各ターゲットの名前（列見出しに使う）
 */
export function buildComparisonCsv(
  songs: SongWithRival[],
  labels: string[],
): string {
  const targetCount = Math.max(labels.length, 1);
  const header = [
    "title",
    "difficulty",
    "level",
    "notes",
    "you EX",
    "you BPI",
    ...Array.from({ length: targetCount }, (_, i) => {
      const name = labels[i] ?? `RIVAL${i + 1}`;
      return [`${name} EX`, `${name} BPI`, `${name} EX diff`, `${name} BPI diff`];
    }).flat(),
  ];

  const rows = songs.map((song) => {
    const comparisons = comparisonsOf(song, targetCount);
    return [
      song.title,
      song.difficulty,
      song.difficultyLevel,
      song.notes,
      num(song.exScore),
      num(song.bpi, 2),
      ...Array.from({ length: targetCount }, (_, i) => {
        const c = comparisons[i];
        return [
          num(c?.rival?.exScore),
          num(c?.rival?.bpi, 2),
          num(c?.exDiff),
          num(c?.bpiDiff, 2),
        ];
      }).flat(),
    ];
  });

  return [header, ...rows]
    .map((cols) => cols.map(escapeCsv).join(","))
    .join("\r\n");
}
