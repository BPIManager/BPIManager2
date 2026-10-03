import { BpiV2, type ChartV2, type PlayedScoreV2 } from "@bpim/bpicalc";
import type {
  IBpiBasicSongData,
  IBpiScoreObservation,
} from "@/types/songs/bpi";
import {
  NEW_BPI_Z0,
  NEW_BPI_Z100,
  NEW_BPI_Z_REF,
  NEW_BPI_RESIDUAL_RMSE,
  NEW_BPI_Z100_IQR,
  NEW_BPI_COEF_MEDIAN,
  NEW_BPI_RANK_CURVE,
  NEW_BPI_ARENA_POPULATION_SIZE,
} from "@/constants/iidx/newBpi/modelConstants";

/**
 * BPI（Beat Power Indicator）計算の静的クラス。実体は @bpim/bpicalc の BpiV2（分布ベース）。
 * 単曲BPI・逆算・総合BPI（シフト法）・推定順位を提供する。
 */
export class BpiCalculator {
  private static readonly v2 = new BpiV2({
    z0: NEW_BPI_Z0,
    zRef: NEW_BPI_Z_REF,
    z100Median: NEW_BPI_Z100,
    z100Iqr: NEW_BPI_Z100_IQR,
    residualRmse: NEW_BPI_RESIDUAL_RMSE,
    coefMedian: NEW_BPI_COEF_MEDIAN,
    rankCurve: NEW_BPI_RANK_CURVE,
    arenaPopulationSize: NEW_BPI_ARENA_POPULATION_SIZE,
  });

  private static toChart(song: IBpiBasicSongData): ChartV2 {
    return {
      notes: song.notes,
      kaidenAvg: song.kaidenAvg,
      wrScore: song.wrScore,
      coef: song.coef ?? null,
      mu: song.mu ?? null,
      sigma: song.sigma ?? null,
      residualVar: song.residualVar ?? null,
    };
  }

  /**
   * 単曲 BPI を計算する。
   *
   * @param s - プレイヤーの EX スコア
   * @param song - 楽曲データ（ノーツ数・皆伝平均・WR スコア・補正係数・mu/sigma/residualVar）
   * @returns BPI 値。`mu`/`sigma` が無い（ALS対象外・未計算）曲は `null`
   */
  public static calc(s: number, song: IBpiBasicSongData): number | null {
    return this.v2.chart(this.toChart(song)).bpi(s);
  }

  /**
   * 目標 BPI を達成するために必要な EX スコアを逆算する。
   *
   * @param targetBpi - 目標とする BPI 値
   * @param song - 楽曲データ
   * @param ceiled - `true`(デフォルト)なら切り上げ、`false`なら小数のまま返す
   * @returns 目標 BPI を達成するための EX スコア（0 〜 最大スコア）。`mu`/`sigma` が無ければ `null`
   */
  public static calcFromBPI(
    targetBpi: number,
    song: IBpiBasicSongData,
    ceiled: boolean = true,
  ): number | null {
    return this.v2.chart(this.toChart(song)).scoreFor(targetBpi, ceiled);
  }

  /**
   * 単曲BPIから推定順位を引く（表示用）。
   */
  public static estimateRankFromBpi(bpi: number): number {
    return this.v2.rankFromSingle(bpi);
  }

  /**
   * 楽曲の mu/sigma・BPI0/100 アンカー・補正指数 gamma・カーブ指数 coef・実効指数 k を式表示（FormulaCard 等）用に取得する。
   * mu/sigma が無い曲は null。
   */
  public static getSongParams(song: IBpiBasicSongData): {
    mu: number;
    sigma: number;
    z0: number;
    z100: number;
    gamma: number;
    coef: number;
    k: number;
  } | null {
    return this.v2.chart(this.toChart(song)).params;
  }

  /**
   * プレイヤーの潜在スキル a（ベイズ縮小推定後、z尺度）を取得する。未プレイ曲の予測BPIはこの値から逆算される
   *
   * @param observations - そのユーザーが実際にプレイしたスコア
   * @param allSongs - mu/sigma込みの曲データ（`calculateTotalBPI`と同様songId突き合わせに使う）
   */
  public static estimateLatentSkill(
    observations: IBpiScoreObservation[],
    allSongs: (IBpiBasicSongData & { songId: number })[],
  ): number | null {
    const songById = new Map(allSongs.map((s) => [s.songId, s]));
    const played: PlayedScoreV2[] = observations.map((o) => ({
      chart: this.toChart(
        songById.get(o.songId) ?? {
          notes: o.notes,
          kaidenAvg: null,
          wrScore: null,
        },
      ),
      exScore: o.exScore,
    }));
    return this.v2.player(played).latentSkill;
  }

  /**
   * 総合 BPI をシフト法で計算する。プレイ済み曲は単曲 BPI をそのまま使い、未プレイ曲のみ潜在スキル（observations から推定）で予測値を埋める。
   *
   * @param observations - そのユーザーが実際にプレイしたスコア
   * @param allSongs - 集計対象の全楽曲（songId 必須。未プレイ曲の判定・予測に使う）
   * @returns 総合 BPI 値。有効な観測が1件も無ければ床（-15）
   */
  public static calculateTotalBPI(
    observations: IBpiScoreObservation[],
    allSongs: (IBpiBasicSongData & { songId: number })[],
  ): number {
    // 潜在スキル推定にはmu/sigmaが要るため、observations自体ではなく
    // allSongsに載っているmu/sigma込みの曲データと突き合わせる。
    const songById = new Map(allSongs.map((s) => [s.songId, s]));
    const played: PlayedScoreV2[] = observations.map((o) => ({
      chart: this.toChart(
        songById.get(o.songId) ?? {
          notes: o.notes,
          kaidenAvg: null,
          wrScore: null,
        },
      ),
      exScore: o.exScore,
    }));
    const exScoreBySongId = new Map(
      observations.map((o) => [o.songId, o.exScore]),
    );

    const total = this.v2.player(played).totalBpi(
      allSongs.map((song) => ({
        chart: this.toChart(song),
        exScore: exScoreBySongId.get(song.songId),
      })),
      allSongs.length,
    );
    return typeof total === "number" && Number.isFinite(total) ? total : -15;
  }

  /**
   * 総合BPI → 推定順位のパラメトリックな変換に使う基準人数(アリーナA帯人数ベース)
   */
  private static readonly RANK_BASE_TOTAL = 3000;

  /**
   * 総合 BPI から、アリーナ上位母集団内のおおよその順位を推定する（表示用の目安）。
   * 原典と同形のべき乗カーブ（rank = RANK_BASE_TOTAL^((100-totalBpi)/100)）を使う。
   *
   * @param totalBpi - 総合 BPI 値
   * @returns 推定順位（整数）
   */
  public static estimateRank(totalBpi: number): number {
    return Math.ceil(Math.pow(this.RANK_BASE_TOTAL, (100 - totalBpi) / 100));
  }

  /**
   * 総合BPIの表示値に既知の最高値を下回らないラチェットを適用する。書き込み経路（呼び出し元）の責務とする。
   * 未プレイ曲の予測で総合BPIが下がりうるため、記録としての体験を保つよう max を取る。
   *
   * @param previousBest - これまでに記録された最高の総合BPI（記録が無ければ null）
   * @param freshValue - 今回新しく算出した総合BPI
   * @returns 書き込むべき総合BPI（previousBest と freshValue のうち大きい方）
   */
  public static ratchetTotalBpi(
    previousBest: number | null,
    freshValue: number,
  ): number {
    // NaN（sigma=0 等の異常譜面が混ざった場合）を Math.max に通すと NaN が保存されるため、
    // 有限でない新値は採用せず既存の最高値（無ければ -15）を維持する
    if (!Number.isFinite(freshValue)) return previousBest ?? -15;
    return previousBest !== null
      ? Math.max(previousBest, freshValue)
      : freshValue;
  }
}
