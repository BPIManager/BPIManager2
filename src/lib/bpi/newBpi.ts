import { newBpiSongParamMap } from "@/constants/iidx/newBpi/songParams";

export interface NewBpiSongBasicData {
  songId: number;
  notes: number;
  /** 皆伝平均スコア。BPI0のアンカー。 */
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
 * `z0`/`z100` は issue #302 が提案する全曲共通の定数ではなく、
 * 「BPI0 = その曲の皆伝平均」「BPI100 = その曲の歴代全一」という
 * BPI本来の定義（原典）を崩さないよう、曲ごとに実際の皆伝平均・全一の
 * z値を使う。この方式では #302 が解決しようとしたWR更新時の不安定性
 * （他人のWR更新で自分のBPIが動く）は残ったままになる点に注意。
 * mu/sigmaによる分布フィットで「曲間のカーブの歪み」自体は補正される。
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
   * 曲ごとのBPI0/100アンカー（皆伝平均・全一のz値）を算出する。
   * どちらかが欠けている楽曲はnullを返す（新方式の計算自体ができない）。
   */
  private static getAnchors(
    song: NewBpiSongBasicData,
  ): { mu: number; sigma: number; m: number; z0: number; z100: number } | null {
    const param = newBpiSongParamMap.get(song.songId);
    if (!param || song.notes === 0) return null;
    if (song.kaidenAvg === null || song.wrScore === null) return null;

    const m = song.notes * 2;
    const zAt = (score: number) =>
      (this.tOf(score, m) - param.mu) / param.sigma;
    const z0 = zAt(song.kaidenAvg);
    const z100 = zAt(song.wrScore);
    if (Math.abs(z100 - z0) < 1e-9) return null;

    return { mu: param.mu, sigma: param.sigma, m, z0, z100 };
  }

  /**
   * 指定楽曲のmu/sigma、およびBPI0/100アンカー(z0/z100、曲ごとの
   * 皆伝平均・全一のz値)を表示用に取得する。式表示(FormulaCard等)向け。
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
   * 新方式（z尺度、曲ごとに皆伝平均=0・全一=100で再アンカー）での
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
