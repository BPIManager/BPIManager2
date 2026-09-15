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
} from "@/constants/iidx/newBpi/songParams";

/**
 * BPI（Beat Power Indicator）計算ロジックを提供する静的クラス。
 *
 * 実体は npm パッケージ `@bpim/bpicalc` の {@link BpiV2}（分布ベース再定義、
 * issue #380 でV1から本番切り替え）。`songDef` 由来の楽曲データ
 * （{@link IBpiBasicSongData}、`mu`/`sigma`/`residualVar` 込み）を `BpiV2` に渡す。
 *
 * - 単曲 BPI の計算（`calc`）
 * - BPI からスコアの逆算（`calcFromBPI`）
 * - 総合 BPI の計算（`calculateTotalBPI`、シフト法。実測観測から潜在スキルを
 *   推定し、未プレイ曲を予測で埋めて集約する）
 * - 順位推定（`estimateRank`）
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
   * 指定楽曲のmu/sigma、BPI0/100アンカー、曲間の歪み補正指数`gamma`、カーブ指数
   * `coef`、実効カーブ指数`k = clamp(gamma*coef)`を表示用に取得する。
   * 式表示(FormulaCard等)向け。`mu`/`sigma`が無い曲は `null`
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
   * 総合 BPI を計算する（シフト法）。
   *
   * 実際にプレイした曲の単曲BPIはそのまま使い、未プレイ曲だけを潜在スキル
   * （`observations` 全体から推定）からの予測値で埋めたうえで集約する。
   *
   * @param observations - そのユーザーが実際にプレイしたスコア
   * @param allSongs - 集計対象の全楽曲（`songId` 必須。未プレイ曲の判定・予測に使う）
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
    return total ?? -15;
  }

  /**
   * 総合BPI → 推定順位のパラメトリックな変換に使う基準人数(アリーナA帯人数ベース)
   */
  private static readonly RANK_BASE_TOTAL = 3000;

  /**
   * 総合 BPI から、アリーナ上位母集団内でのおおよその順位を推定する。
   *
   * V1・V2の間でモデルは変わったが、「総合BPIの値をおおよその順位に変換する」
   * という表示用の目安としての位置づけは変わらないため、原典と同形の
   * べき乗カーブ（`rank = RANK_BASE_TOTAL^((100-totalBpi)/100)`）をそのまま使う
   * （V2固有の潜在スキルベースの順位推定 `NewBpiCalculator.estimateRank` とは別物）。
   *
   * @param totalBpi - 総合 BPI 値
   * @returns 推定順位（整数）
   */
  public static estimateRank(totalBpi: number): number {
    return Math.ceil(Math.pow(this.RANK_BASE_TOTAL, (100 - totalBpi) / 100));
  }

  /**
   * 総合BPIの表示値に「既知の最高値を下回らない」ラチェットを適用する。
   *
   * V2の総合BPI（シフト法）は、未プレイ曲の予測に使う潜在スキル`a_i`が
   * 新しい観測(特に初見の低い実力のプレイ)で下がりうるため、プレイ済み曲の
   * BPIが1つも下がっていなくても、総合BPIそのものが下がることがある
   * （V1は未プレイ曲を一律-15固定だったためこの効果が無く、単調非減少だった）。
   * 表示上の「記録」としての体験を保つため、書き込み時に過去の最高値との
   * `max`を取る。`calculateTotalBPI`自体は「今の状態を計算する」役割に
   * とどめ、ラチェットは呼び出し元（DB書き込み経路）の責務とする。
   *
   * @param previousBest - これまでに記録された最高の総合BPI（記録が無ければ`null`）
   * @param freshValue - 今回新しく算出した総合BPI
   * @returns 書き込むべき総合BPI（`previousBest`と`freshValue`のうち大きい方）
   */
  public static ratchetTotalBpi(
    previousBest: number | null,
    freshValue: number,
  ): number {
    return previousBest !== null
      ? Math.max(previousBest, freshValue)
      : freshValue;
  }
}
