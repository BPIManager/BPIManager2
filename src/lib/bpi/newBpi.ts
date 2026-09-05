import {
  newBpiSongParamMap,
  NEW_BPI_Z0,
  NEW_BPI_Z100,
  NEW_BPI_Z_REF,
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
 * newBpi(s) = 100 * sign(z-z0) * |(z(s) - z0) / (z100 - z0)|^gamma
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
 * `gamma`（曲間のカーブの歪みを補正する指数、全曲同じ式で算出）:
 * 「かなり強いプレイヤー(z_ref、全曲共通の基準潜在能力位置)が、典型的な
 * gap(z100の全曲中央値 − z0)の曲で得られるはずのBPI」を、この曲でも同じ
 * ように得られるよう解析的に決める。ratio=1(z=z100)では常に1^gamma=1に
 * なるため、gammaの値に関わらずBPI100=WRは厳密に保たれる。
 *
 * WR(全一)は曲ごとの実スコアという単一の順序統計量のため、z100が全曲共通の
 * 典型的なgapから外れる(=WRが平均的な強豪プレイヤー層から見て極端に遠い/
 * 近い)曲が一定数ある。gammaはこの外れを補正し、"z_ref付近のプレイヤー"に
 * とってのBPIの意味が曲間で揃うようにする(issue #299のもう一つの実測:
 * 全一の到達難度が曲間で5〜13SDばらつく問題への対処)。
 *
 * 床の撤廃自体がissue #303の論点だが、比較UIでの見え方を現行に揃えるため
 * 暫定的に現行と同じ `BPI_FLOOR`（-15）でクランプしている。恒久対応（尺度の
 * 正式決定）はissue #303で行う。
 */
export class NewBpiCalculator {
  /** 単曲BPIの下限。現行実装(`BpiCalculator`)に合わせた暫定値。 */
  public static readonly BPI_FLOOR = -15;

  /** gammaの許容範囲。極端な曲でも式が破綻しないようクランプする。 */
  private static readonly GAMMA_MIN = 0.3;
  private static readonly GAMMA_MAX = 3;

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
   * 曲ごとのgamma(カーブ補正指数)を算出する。全曲同じ式・同じ全曲共通定数
   * (z0/z100の全曲中央値/z_ref)から導出し、曲ごとに式そのものを変えることは
   * しない。典型的なgapの曲ではgamma=1(補正なし)になる。
   */
  private static gammaFor(z100: number, z0: number): number {
    const gRef = NEW_BPI_Z100 - z0; // 全曲中央値ベースの典型的なgap
    const gSong = z100 - z0;
    const ratioAtRefTypical = (NEW_BPI_Z_REF - z0) / gRef;
    const ratioAtRefSong = (NEW_BPI_Z_REF - z0) / gSong;
    if (
      ratioAtRefTypical <= 0 ||
      ratioAtRefTypical >= 1 ||
      ratioAtRefSong <= 0 ||
      ratioAtRefSong >= 1
    ) {
      return 1;
    }
    const gamma = Math.log(ratioAtRefTypical) / Math.log(ratioAtRefSong);
    if (!Number.isFinite(gamma)) return 1;
    return Math.max(this.GAMMA_MIN, Math.min(this.GAMMA_MAX, gamma));
  }

  /**
   * BPI100アンカー（曲ごとの全一のz値）とBPI0アンカー（全曲共通のz0）、
   * および曲間の歪み補正指数gammaを算出する。全一が未設定の楽曲はnullを
   * 返す（新方式の計算自体ができない）。
   */
  private static getAnchors(song: NewBpiSongBasicData): {
    mu: number;
    sigma: number;
    m: number;
    z0: number;
    z100: number;
    gamma: number;
  } | null {
    const param = newBpiSongParamMap.get(song.songId);
    if (!param || song.notes === 0) return null;
    if (song.wrScore === null) return null;

    const m = song.notes * 2;
    const zAt = (score: number) =>
      (this.tOf(score, m) - param.mu) / param.sigma;
    const z0 = NEW_BPI_Z0;
    const z100 = zAt(song.wrScore);
    if (Math.abs(z100 - z0) < 1e-9) return null;

    const gamma = this.gammaFor(z100, z0);
    return { mu: param.mu, sigma: param.sigma, m, z0, z100, gamma };
  }

  /**
   * 指定楽曲のmu/sigma、BPI0/100アンカー(z0=全曲共通の定数、z100=曲ごとの
   * 全一のz値)、および曲間の歪み補正指数gammaを表示用に取得する。
   * 式表示(FormulaCard等)向け。
   */
  public static getSongParams(song: NewBpiSongBasicData): {
    mu: number;
    sigma: number;
    z0: number;
    z100: number;
    gamma: number;
  } | null {
    const anchors = this.getAnchors(song);
    if (!anchors) return null;
    return {
      mu: anchors.mu,
      sigma: anchors.sigma,
      z0: anchors.z0,
      z100: anchors.z100,
      gamma: anchors.gamma,
    };
  }

  /**
   * 新方式（z尺度、曲ごとの全一=100・全曲共通のz0=0で再アンカー、
   * gammaで曲間の歪みを補正）での単曲BPIを計算する。
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

    const { mu, sigma, m, z0, z100, gamma } = anchors;
    const z = (this.tOf(exScore, m) - mu) / sigma;
    const ratio = (z - z0) / (z100 - z0);
    const bpi = 100 * Math.sign(ratio) * Math.pow(Math.abs(ratio), gamma);
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

    const { mu, sigma, m, z0, z100, gamma } = anchors;
    const sign = Math.sign(targetBpi) || 1;
    const ratio = Math.pow(Math.abs(targetBpi) / 100, 1 / gamma);
    const z = z0 + sign * ratio * (z100 - z0);
    const t = mu + sigma * z;
    const miss = Math.exp(-t);
    const s = m - miss;

    if (s > m) return m;
    if (s < 0) return 0;
    return s;
  }
}
