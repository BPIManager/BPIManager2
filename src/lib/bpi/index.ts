import { BpiV1 } from "@bpim/bpicalc";
import type { IBpiBasicSongData } from "@/types/songs/bpi";

/**
 * BPI（Beat Power Indicator）計算ロジックを提供する静的クラス。
 *
 * 実体は npm パッケージ `@bpim/bpicalc` の {@link BpiV1}（V1 = 現行方式）。
 * このクラスは呼び出し側の互換のための薄いファサードで、`songDef` 由来の
 * 楽曲データ（{@link IBpiBasicSongData}）をそのまま `BpiV1` に渡す。
 *
 * - 単曲 BPI の計算（`calc`）
 * - BPI からスコアの逆算（`calcFromBPI`）
 * - 総合 BPI のべき乗平均計算（`calculateTotalBPI`）
 * - 順位推定（`estimateRank`）
 */
export class BpiCalculator {
  /** デフォルト定数（`defaultPowCoef` 1.175 / `rankBaseTotal` 2699 / `rankBaseSingle` 2616）で共有する。 */
  private static readonly v1 = new BpiV1();

  /**
   * 総合BPIのべき乗平均で使用する指数を計算する。
   *
   * @param totalSongCount - 対象楽曲の総数
   */
  public static totalBpiExponent(totalSongCount: number): number {
    return this.v1.totalBpiExponent(totalSongCount);
  }

  /**
   * 単曲 BPI を計算する。
   *
   * @param s - プレイヤーの EX スコア
   * @param song - 楽曲データ（ノーツ数・皆伝平均・WR スコア・補正係数）
   * @returns BPI 値（-15 〜 理論上限）。スコアが最大値を超える場合は `null`
   */
  public static calc(s: number, song: IBpiBasicSongData): number | null {
    return this.v1.chart(song).bpi(s);
  }

  /**
   * 目標 BPI を達成するために必要な EX スコアを逆算する。
   *
   * @param targetBpi - 目標とする BPI 値
   * @param song - 楽曲データ
   * @param ceiled - `true` の場合は切り上げ、`false` の場合は小数のまま返す（デフォルト: `true`）
   * @returns 目標 BPI を達成するための EX スコア（0 〜 最大スコア）
   */
  public static calcFromBPI(
    targetBpi: number,
    song: IBpiBasicSongData,
    ceiled: boolean = true,
  ): number {
    return this.v1.chart(song).scoreFor(targetBpi, ceiled);
  }

  /**
   * 総合 BPI をべき乗平均で計算する。
   *
   * 全楽曲数に対してプレイしていない楽曲は BPI `-15` として扱う。
   *
   * @param allBpis - 各楽曲の BPI 配列（降順ソート推奨）
   * @param totalSongCount - 対象楽曲の総数
   * @returns 総合 BPI 値
   */
  public static calculateTotalBPI(
    allBpis: number[],
    totalSongCount: number,
  ): number {
    return this.v1.total(allBpis, totalSongCount);
  }

  /**
   * 総合 BPI から皆伝内おおよその順位を推定する。
   *
   * @param totalBpi - 総合 BPI 値
   * @returns 推定順位（整数）
   */
  public static estimateRank(totalBpi: number): number {
    return this.v1.rankFromTotal(totalBpi);
  }
}
