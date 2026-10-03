import { ALL_RADAR_CATEGORIES } from "@/constants/iidx/radars";
import { BpiCalculator } from "@/lib/bpi";
import {
  topElementMap,
  topElementsByCategory,
} from "@/constants/iidx/radars/topElements";
import {
  RadarCategory,
  RadarResponse,
  RadarSongEntry,
} from "@/types/stats/radar";
import type { IBpiBasicSongData, IBpiScoreObservation } from "@/types/songs/bpi";

interface RadarScoreInput {
  title: string;
  difficulty: string | null;
  exScore: number;
  notes: number | null;
  bpi: number | string | null;
}

/** `${title}___${difficulty}` キーで曲マスタ（mu/sigma込み）を引けるMap。 */
export type RadarSongMaster = Map<
  string,
  IBpiBasicSongData & { songId: number }
>;

/** `songMasterRepo.getSongMasterWithDef()` 等の結果から {@link RadarSongMaster} を組み立てる。 */
export function buildRadarSongMaster(
  songs: {
    songId: number;
    title: string;
    difficulty: string | null;
    notes: number;
    kaidenAvg: number | null;
    wrScore: number | null;
    coef?: number | null;
    mu?: number | null;
    sigma?: number | null;
    residualVar?: number | null;
  }[],
): RadarSongMaster {
  return new Map(
    songs.map((s) => [
      `${s.title}___${s.difficulty}`,
      {
        songId: s.songId,
        notes: s.notes,
        kaidenAvg: s.kaidenAvg,
        wrScore: s.wrScore,
        coef: s.coef,
        mu: s.mu,
        sigma: s.sigma,
        residualVar: s.residualVar,
      },
    ]),
  );
}

/**
 * スコアリストからレーダーチャートデータを計算する。各楽曲を topElements.json でカテゴリに分類し、カテゴリごとに総合BPIを算出する。
 * 未プレイ曲を潜在スキルから予測するため、songMaster から songId・mu・sigma 等を引けること（プレイ済み・未プレイ問わず）が必要。
 *
 * @param scores - 計算対象のスコア配列（タイトル・難易度・EX スコア・BPI）
 * @param songMaster - `${title}___${difficulty}` キーの曲マスタ（mu/sigma込み）
 * @returns 6 カテゴリそれぞれの総合 BPI と楽曲リストを含むレーダーデータ
 */
export function calculateRadar(
  scores: RadarScoreInput[],
  songMaster: RadarSongMaster,
  validSongKeys?: Set<string>,
): RadarResponse {
  const categoryGroup = new Map<RadarCategory, RadarScoreInput[]>();
  ALL_RADAR_CATEGORIES.forEach((cat) => categoryGroup.set(cat, []));

  const playedKeys = new Set(
    scores.map((s) => `${s.title}___${s.difficulty}`),
  );

  for (const score of scores) {
    const key = `${score.title}___${score.difficulty}`;
    const category = topElementMap.get(key);
    if (category) {
      categoryGroup.get(category)!.push(score);
    }
  }

  // 潜在スキル推定はカテゴリを問わずユーザーの全観測を使う
  const allObservations: IBpiScoreObservation[] = scores.flatMap((s) => {
    const master = songMaster.get(`${s.title}___${s.difficulty}`);
    return master
      ? [{ songId: master.songId, notes: master.notes, exScore: s.exScore }]
      : [];
  });

  const result = {} as RadarResponse;

  for (const category of ALL_RADAR_CATEGORIES) {
    const categoryScores = categoryGroup.get(category)!;

    const unplayedSongs = (topElementsByCategory.get(category) ?? []).filter(
      (e) =>
        !playedKeys.has(`${e.title}___${e.difficulty}`) &&
        (validSongKeys === undefined || validSongKeys.has(`${e.title}___${e.difficulty}`)),
    );

    // このカテゴリの総合BPIの対象楽曲（プレイ済み+未プレイ）。songMasterに
    // 無い曲（削除済み等）は総合BPIの計算対象から外れる。
    const categoryMaster: (IBpiBasicSongData & { songId: number })[] = [
      ...categoryScores,
      ...unplayedSongs,
    ].flatMap((s) => {
      const master = songMaster.get(`${s.title}___${s.difficulty}`);
      return master ? [master] : [];
    });

    const totalBpi =
      categoryMaster.length > 0
        ? BpiCalculator.calculateTotalBPI(allObservations, categoryMaster)
        : -15;

    result[category] = {
      totalBpi,
      songs: [
        ...categoryScores.map(
          (s): RadarSongEntry => ({
            title: s.title,
            difficulty: s.difficulty ?? "",
            exScore: s.exScore,
            notes: s.notes,
            bpi: Number(s.bpi ?? -15),
          }),
        ),
        ...unplayedSongs.map(
          (e): RadarSongEntry => ({
            title: e.title,
            difficulty: e.difficulty,
            exScore: null,
            notes: null,
            bpi: -15,
          }),
        ),
      ].sort((a, b) => b.bpi - a.bpi),
    };
  }

  return result;
}
