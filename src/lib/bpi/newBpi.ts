import { BpiV2, type ChartV2, type PlayedScoreV2 } from "@bpim/bpicalc";
import {
  newBpiSongParamMap,
  NEW_BPI_Z0,
  NEW_BPI_Z100,
  NEW_BPI_Z_REF,
  NEW_BPI_RESIDUAL_RMSE,
  NEW_BPI_Z100_IQR,
  NEW_BPI_COEF_MEDIAN,
  NEW_BPI_RANK_CURVE,
  NEW_BPI_ARENA_POPULATION_SIZE,
} from "@/constants/iidx/newBpi/songParams";

export interface NewBpiSongBasicData {
  songId: number;
  notes: number;
  /** 皆伝平均スコア。現状はBPI0のアンカーには使わない（表示・将来用に保持）。 */
  kaidenAvg: number | null;
  /** 世界記録(歴代全一)スコア。BPI100のアンカー。 */
  wrScore: number | null;
}

/** 潜在スキル a_i / 総合BPI(issue #304)の推定に使う1曲分の観測。 */
export interface NewBpiScoreObservation {
  songId: number;
  notes: number;
  exScore: number;
}

/**
 * 分布ベース（2母数潜在能力モデル）の単曲BPI・総合BPI（新方式BPIプレビュー
 * `/new-bpi`）。実体は npm パッケージ `@bpim/bpicalc` の {@link BpiV2}。
 *
 * `BpiCalculator`（V1）とは独立。モデル定数（`z0` 等）は `songParams.json`
 * 由来の `NEW_BPI_*` から、曲ごとの `mu`/`sigma`/`residualVar`/`coef` は
 * `newBpiSongParamMap` から供給する（`songDef` にはカラムを持たせない）。
 * このクラスは `songId` ベースの呼び出し規約を保つための薄いファサードで、
 * 各メソッドで曲データに分布パラメータをマージして `BpiV2` に渡す。
 */
export class NewBpiCalculator {
  /** 単曲BPIの下限。`BpiV2` の `bpiFloor` デフォルトに一致。 */
  public static readonly BPI_FLOOR = -15;

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

  /** 曲の基本データに `newBpiSongParamMap` の分布パラメータをマージして `ChartV2` にする。 */
  private static toChart(song: NewBpiSongBasicData): ChartV2 {
    const param = newBpiSongParamMap.get(song.songId);
    return {
      notes: song.notes,
      kaidenAvg: song.kaidenAvg,
      wrScore: song.wrScore,
      coef: param?.coef ?? null,
      mu: param?.mu ?? null,
      sigma: param?.sigma ?? null,
      residualVar: param?.residualVar ?? null,
    };
  }

  private static toPlayed(
    observations: NewBpiScoreObservation[],
  ): PlayedScoreV2[] {
    return observations.map((o) => ({
      chart: this.toChart({
        songId: o.songId,
        notes: o.notes,
        kaidenAvg: null,
        wrScore: null,
      }),
      exScore: o.exScore,
    }));
  }

  /**
   * 指定楽曲の分布パラメータ（mu/sigma）が用意されているかどうか。
   * 生成元データでプレイ数が少なすぎた楽曲は含まれない。
   */
  public static hasParams(songId: number): boolean {
    return newBpiSongParamMap.has(songId);
  }

  /**
   * 指定楽曲のmu/sigma、BPI0/100アンカー、曲間の歪み補正指数`gamma`、カーブ指数
   * `coef`、実効カーブ指数`k = clamp(gamma*coef)`を表示用に取得する。
   * 式表示(FormulaCard等)向け。全一が未設定・パラメータ未収録の楽曲は `null`。
   */
  public static getSongParams(song: NewBpiSongBasicData): {
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
   * 新方式（z尺度、曲ごとの全一=100・全曲共通のz0で再アンカー、gammaで曲間の
   * 歪みを補正）での単曲BPIを計算する。
   *
   * @param exScore - プレイヤーの EX スコア
   * @param song - 楽曲の基本データ（songId/notes/kaidenAvg/wrScore）
   * @returns BPI値（`BPI_FLOOR` 〜 理論上限）。パラメータ未整備の楽曲は `null`
   */
  public static calc(
    exScore: number,
    song: NewBpiSongBasicData,
  ): number | null {
    return this.v2.chart(this.toChart(song)).bpi(exScore);
  }

  /**
   * 単曲BPIから推定順位を引く（現行 `BpiCalculator` と同じ
   * `rank = 2616^((100 - BPI) / 100)` 形式。表示用）。
   */
  public static estimateRankFromBpi(bpi: number): number {
    return this.v2.rankFromSingle(bpi);
  }

  /**
   * 新方式で目標BPIを達成するために必要なEXスコアを逆算する（推移グラフ描画用）。
   *
   * @param targetBpi - 目標とするBPI値
   * @param song - 楽曲の基本データ（songId/notes/kaidenAvg/wrScore）
   * @returns 目標BPIを達成するためのEXスコア（0〜最大スコア）。パラメータ未整備の楽曲は `null`
   */
  public static calcFromBPI(
    targetBpi: number,
    song: NewBpiSongBasicData,
  ): number | null {
    return this.v2.chart(this.toChart(song)).scoreFor(targetBpi);
  }

  /**
   * プレイヤーの潜在スキル a_i（issue #304）を、そのユーザーが持つスコアから
   * 逆分散加重の最小二乗解 + 事前分布 a_i〜N(0,1) への縮小推定で求める。
   */
  public static estimateLatentSkill(
    observations: NewBpiScoreObservation[],
  ): number | null {
    return this.v2.player(this.toPlayed(observations)).latentSkill;
  }

  /**
   * 総合BPI（issue #304）を、実際にプレイした曲の単曲BPIはそのまま使い、
   * 未プレイ曲だけを潜在スキル a_i からの予測値で埋めたうえで、シフト法
   * （issue #297）で集約して算出する。潜在スキルは `observations` 全体から
   * 推定する（`allSongs` に無いスコアも推定には寄与する）。
   *
   * @param observations - そのユーザーが実際にプレイしたスコア
   * @param allSongs - 集計対象の全楽曲（未プレイ曲の判定・予測に使う）
   * @returns 総合BPI。有効な曲が1つも無い場合は `null`
   */
  public static calculateTotalBPI(
    observations: NewBpiScoreObservation[],
    allSongs: NewBpiSongBasicData[],
  ): number | null {
    const exScoreBySongId = new Map(
      observations.map((o) => [o.songId, o.exScore]),
    );
    return this.v2.player(this.toPlayed(observations)).totalBpi(
      allSongs.map((song) => ({
        chart: this.toChart(song),
        exScore: exScoreBySongId.get(song.songId),
      })),
      allSongs.length,
    );
  }

  /**
   * プレイヤーの潜在スキル a から、アリーナA帯（z0と同じ母集団）内での推定順位を
   * 経験的カーブ（`NEW_BPI_RANK_CURVE`）の線形補間で算出する。
   *
   * @param a - 潜在スキルの推定値（{@link estimateLatentSkill}の返り値）
   * @returns アリーナA帯内での推定順位（1〜`arenaPopulationSize`）
   */
  public static estimateRank(a: number): number {
    return this.v2.rankFromSkill(a);
  }
}
