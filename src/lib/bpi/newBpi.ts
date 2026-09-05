import {
  newBpiSongParamMap,
  NEW_BPI_Z0,
} from "@/constants/iidx/newBpi/songParams";

export interface NewBpiSongBasicData {
  songId: number;
  notes: number;
  /** 皆伝平均スコア。現状はBPI0のアンカーには使わない（表示・将来用に保持）。 */
  kaidenAvg: number | null;
  /** 世界記録(歴代全一)スコア。BPI100のアンカー。 */
  wrScore: number | null;
}

/**
 * issue #299〜304 で提案されている分布ベース（2母数潜在能力モデル）の
 * 単曲BPI計算（検証用）。
 *
 * `BpiCalculator`（本番実装）とは独立したモジュール。`mu`/`sigma` は
 * `songDef` に持たせず `songParams.json`（ALS推定の生成物）から読む。
 *
 * z(s) = (t(s) - mu) / sigma,  t(s) = -ln(m - s)
 * newBpi(s) = 100 * (z(s) - z0) / (z100 - z0)
 *
 * アンカーの決め方はissue #302の提案と実測（issue #299の分析）を
 * 踏まえたハイブリッド:
 * - z100（BPI100）は「歴代全一=100」という原典の定義を崩さないよう、
 *   全曲共通の定数ではなく曲ごとに実際の全一のz値を使う
 * - z0（BPI0）は issue #302 の提案通り、全曲共通の定数（`NEW_BPI_Z0`、
 *   実測: 皆伝平均のz位置の全曲中央値）を使う。皆伝平均アンカーは
 *   曲間のばらつきが元々小さい(issue #299実測で0.53SD程度)ため、
 *   全曲共通にしても「BPI0≈皆伝平均」からの乖離は小さい
 *
 * このハイブリッドでは、issue #302 が解決しようとしたWR更新時の不安定性
 * （他人のWR更新で自分のBPIが動く問題）はz100が曲ごとの実WR依存のままの
 * ため残る。mu/sigmaによる分布フィットで「曲間のカーブの歪み」自体は
 * 補正される。
 *
 * 床の撤廃自体がissue #303の論点だが、比較UIでの見え方を現行に揃えるため
 * 暫定的に現行と同じ `BPI_FLOOR`（-15）でクランプしている。恒久対応（尺度の
 * 正式決定）はissue #303で行う。
 */
export class NewBpiCalculator {
  /** 単曲BPIの下限。現行実装(`BpiCalculator`)に合わせた暫定値。 */
  public static readonly BPI_FLOOR = -15;

  /**
   * 指定楽曲の分布パラメータ（mu/sigma）が用意されているかどうか。
   * 生成元データでプレイ数が少なすぎた楽曲は含まれない。
   */
  public static hasParams(songId: number): boolean {
    return newBpiSongParamMap.has(songId);
  }

  private static tOf(score: number, m: number): number {
    const miss = Math.max(0.5, m - Math.min(Math.max(score, 0), m));
    return -Math.log(miss);
  }

  /**
   * BPI100アンカー（曲ごとの全一のz値）とBPI0アンカー（全曲共通のz0）を
   * 算出する。全一が未設定の楽曲はnullを返す（新方式の計算自体ができない）。
   */
  private static getAnchors(
    song: NewBpiSongBasicData,
  ): { mu: number; sigma: number; m: number; z0: number; z100: number } | null {
    const param = newBpiSongParamMap.get(song.songId);
    if (!param || song.notes === 0) return null;
    if (song.wrScore === null) return null;

    const m = song.notes * 2;
    const zAt = (score: number) =>
      (this.tOf(score, m) - param.mu) / param.sigma;
    const z0 = NEW_BPI_Z0;
    const z100 = zAt(song.wrScore);
    if (Math.abs(z100 - z0) < 1e-9) return null;

    return { mu: param.mu, sigma: param.sigma, m, z0, z100 };
  }

  /**
   * 指定楽曲のmu/sigma、およびBPI0/100アンカー(z0=全曲共通の定数、
   * z100=曲ごとの全一のz値)を表示用に取得する。式表示(FormulaCard等)向け。
   */
  public static getSongParams(
    song: NewBpiSongBasicData,
  ): { mu: number; sigma: number; z0: number; z100: number } | null {
    const anchors = this.getAnchors(song);
    if (!anchors) return null;
    return {
      mu: anchors.mu,
      sigma: anchors.sigma,
      z0: anchors.z0,
      z100: anchors.z100,
    };
  }

  /**
   * 新方式（z尺度、曲ごとの全一=100・全曲共通のz0=0で再アンカー）での
   * 単曲BPIを計算する。
   *
   * @param exScore - プレイヤーの EX スコア
   * @param song - 楽曲の基本データ（songId/notes/kaidenAvg/wrScore）
   * @returns BPI値（`BPI_FLOOR` 〜 理論上限）。パラメータ未整備の楽曲は `null`
   */
  public static calc(
    exScore: number,
    song: NewBpiSongBasicData,
  ): number | null {
    const anchors = this.getAnchors(song);
    if (!anchors) return null;

    const { mu, sigma, m, z0, z100 } = anchors;
    const z = (this.tOf(exScore, m) - mu) / sigma;
    const bpi = 100 * ((z - z0) / (z100 - z0));
    return Math.max(this.BPI_FLOOR, Math.round(bpi * 100) / 100);
  }

  /**
   * 新方式で目標BPIを達成するために必要なEXスコアを逆算する。
   * `BpiCalculator.calcFromBPI` の新方式版（推移グラフ描画用）。
   *
   * @param targetBpi - 目標とするBPI値
   * @param song - 楽曲の基本データ（songId/notes/kaidenAvg/wrScore）
   * @returns 目標BPIを達成するためのEXスコア（0〜最大スコア）。パラメータ未整備の楽曲は `null`
   */
  public static calcFromBPI(
    targetBpi: number,
    song: NewBpiSongBasicData,
  ): number | null {
    const anchors = this.getAnchors(song);
    if (!anchors) return null;

    const { mu, sigma, m, z0, z100 } = anchors;
    const z = z0 + (targetBpi * (z100 - z0)) / 100;
    const t = mu + sigma * z;
    const miss = Math.exp(-t);
    const s = m - miss;

    if (s > m) return m;
    if (s < 0) return 0;
    return s;
  }
}
