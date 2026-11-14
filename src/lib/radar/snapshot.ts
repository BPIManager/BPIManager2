import { ALL_RADAR_CATEGORIES } from "@/constants/iidx/radars";
import { BpiCalculator } from "@/lib/bpi";
import { IIDX_DIFFICULTIES } from "@/constants/iidx/bpiDifficulties";
import {
  buildRadarSongMaster,
  calculateRadar,
} from "@/lib/radar/calculator";
import type { RadarCategory } from "@/types/stats/radar";

/** レーダー6カテゴリの総合BPI */
export type RadarValues = Record<RadarCategory, number>;

const FLOOR = -15;

/** レーダーの入力にする譜面のレベル（ダッシュボードのレーダー既定の絞り込みと同じ☆12）。有効な譜面キー（未プレイ曲の予測対象）の絞り込みにも使う */
export const RADAR_LEVEL = 12;

interface LatestScore {
  songId: number;
  exScore: number;
  bpi: number | string | null;
}

type SongMasterRows = (Parameters<typeof buildRadarSongMaster>[0][number] & {
  difficultyLevel?: number | null;
})[];

/**
 * ユーザーの最新スコアから、レーダー6カテゴリの総合BPI（ラチェット前）を算出する。
 * ダッシュボードのレーダー既定（☆12・全難易度）と同じ定義で、潜在スキルの推定にも☆12のスコアだけを使う
 * （ラチェット対象の値と表示値の定義を揃えるため）。曲マスタに無い曲は無視される。
 *
 * @param latestScores - 曲ごとの最新スコア
 * @param fullMaster - mu/sigma込みの曲マスタ
 * @param validSongKeys - 対象バージョンで有効な `${title}___${difficulty}` キー
 */
export function computeRadarValues(
  latestScores: LatestScore[],
  fullMaster: SongMasterRows,
  validSongKeys: Set<string>,
): RadarValues {
  const masterById = new Map(fullMaster.map((m) => [m.songId, m]));
  const scores = latestScores.flatMap((s) => {
    const m = masterById.get(s.songId);
    const isRadarTarget =
      !!m &&
      m.difficultyLevel === RADAR_LEVEL &&
      (IIDX_DIFFICULTIES as readonly string[]).includes(m.difficulty ?? "");
    return m && isRadarTarget
      ? [{ title: m.title, difficulty: m.difficulty, exScore: s.exScore, notes: m.notes, bpi: s.bpi }]
      : [];
  });
  const radar = calculateRadar(scores, buildRadarSongMaster(fullMaster), validSongKeys);
  return Object.fromEntries(
    ALL_RADAR_CATEGORIES.map((c) => [c, radar[c].totalBpi]),
  ) as RadarValues;
}

/**
 * カテゴリごとに、既知の最高値を下回らないようラチェットする（総合BPIの {@link BpiCalculator.ratchetTotalBpi} と同じ規則）。
 *
 * @param previousBest - これまでの最高値（履歴が無ければ null）
 * @param fresh - 今回算出した値
 */
export function ratchetRadarValues(
  previousBest: Partial<RadarValues> | null,
  fresh: RadarValues,
): RadarValues {
  return Object.fromEntries(
    ALL_RADAR_CATEGORIES.map((c) => [
      c,
      BpiCalculator.ratchetTotalBpi(previousBest?.[c] ?? null, fresh[c]),
    ]),
  ) as RadarValues;
}

/** decimal 列（文字列で返る）を含む行から、レーダー6カテゴリの数値を取り出す */
export function radarValuesFromRow(row: {
  notes: unknown;
  chord: unknown;
  peak: unknown;
  charge: unknown;
  scratch: unknown;
  soflan: unknown;
}): RadarValues {
  const n = (v: unknown) => (v === null || v === undefined ? FLOOR : Number(v));
  return {
    NOTES: n(row.notes),
    CHORD: n(row.chord),
    PEAK: n(row.peak),
    CHARGE: n(row.charge),
    SCRATCH: n(row.scratch),
    SOFLAN: n(row.soflan),
  };
}

/** カテゴリ値を DB 列名のオブジェクトへ変換する（decimal(5,2) に収まるよう小数第2位へ丸める） */
export function radarValuesToColumns(v: RadarValues) {
  const r = (x: number) => (Math.round(x * 100) / 100).toFixed(2);
  return {
    notes: r(v.NOTES),
    chord: r(v.CHORD),
    peak: r(v.PEAK),
    charge: r(v.CHARGE),
    scratch: r(v.SCRATCH),
    soflan: r(v.SOFLAN),
  };
}
