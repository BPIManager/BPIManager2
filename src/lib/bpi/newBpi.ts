import {
  newBpiSongParamMap,
  NEW_BPI_Z0,
  NEW_BPI_Z100,
  NEW_BPI_Z_REF,
  NEW_BPI_RESIDUAL_RMSE,
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
 *
 * 総合BPI（issue #304）は、実際にプレイした曲は単曲BPIをそのまま使い、
 * 未プレイ曲だけをプレイヤーの潜在スキル a_i からの予測値で埋めたうえで、
 * シフト法（issue #297、{@link shiftedPowerMean}）で集約する
 * （{@link calculateTotalBPI}）。a_i 自体は事前分布 a_i〜N(0,1) への
 * 縮小推定を行う（{@link estimateLatentSkill}）。
 *
 * 単曲BPIの集約ではなく a_i を線形にBPI化した値をそのまま総合BPIとする
 * 素朴な方式も検証したが、これは「得意な数曲で高スコアを出すと総合BPIが
 * 大きく伸びる」という現行方式の性質（べき乗平均の指数が大きく、実質的に
 * 上位の数曲に支配される）を失い、プレイ曲数が多い上位層ほど総合BPIが
 * 直感に反して下がる問題があった（全曲を均した「平均的な実力」になって
 * しまうため）。「実際のスコアはそのまま使い、未プレイ曲だけを埋める」
 * 方式に変更することでこれを避けている。
 *
 * また、埋めた後の集約に現行と同じ生のべき乗平均（`BpiCalculator.
 * calculateTotalBPI`）を使う案も検証したが、これは正側だけでなく負側でも
 * 極値に支配されるため、プレイ曲数が多く実力が平均よりやや低い程度の
 * プレイヤーでも、-15床の単曲BPIが数曲あるだけで総合BPIが-15付近まで
 * 落ち込む「壁」ができてしまった。issue #297のシフト法（指数を
 * `ln(n)/ln((100+c)/(50+c))` に再校正）を集約に採用することでこれを解消
 * している。
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

  /**
   * 加重最小二乗解 a_hat と、その情報量 den(= Σ_j sigma_j²) をあわせて返す。
   * den はそのまま「この推定にどれだけ根拠があるか」を表す量で、
   * 縮小推定（事後分散の逆数の一部）にも未プレイ曲埋めの信頼度重み
   * （{@link predictUnplayedBpi}）にも使う。
   */
  private static estimateLatentSkillWithConfidence(
    observations: NewBpiScoreObservation[],
  ): { a: number; den: number } | null {
    let num = 0;
    let den = 0;
    for (const obs of observations) {
      const param = newBpiSongParamMap.get(obs.songId);
      if (!param || obs.notes === 0) continue;
      const m = obs.notes * 2;
      const t = this.tOf(obs.exScore, m);
      num += param.sigma * (t - param.mu);
      den += param.sigma * param.sigma;
    }
    if (den === 0) return null;
    const residualVariance = NEW_BPI_RESIDUAL_RMSE * NEW_BPI_RESIDUAL_RMSE;
    return { a: num / (den + residualVariance), den };
  }

  /**
   * プレイヤーの潜在スキル a_i（issue #304）を、そのユーザーが持つスコアから
   * 直接推定する（縮小推定つき）。
   *
   * 加重最小二乗の解 a_hat = Σ_j sigma_j(t_ij - mu_j) / Σ_j sigma_j² は、
   * プレイ曲数が少ないユーザーほど分散が大きくなる。事前分布
   * a_i ~ N(0, 1)（ALS推定時にa_iをこの分布へ正規化しているため、母集団の
   * 分布そのもの）と、尤度 a_hat ~ N(a_i, residualVariance / den)
   * （residualVariance = ALS残差の分散、t単位）をベイズ結合した事後平均
   * が a_shrunk = num / (den + residualVariance) になる（標準的なリッジ型の
   * 縮小推定）。プレイ曲数が少なく den が小さいユーザーほど 0（母集団平均）
   * へ強く縮み、多いユーザーほど a_hat に漸近する。
   */
  public static estimateLatentSkill(
    observations: NewBpiScoreObservation[],
  ): number | null {
    return this.estimateLatentSkillWithConfidence(observations)?.a ?? null;
  }

  /** 未プレイ曲埋めで、a_iの推定に対する信頼度をどれだけ重視するか(sigma²単位)。 */
  private static readonly UNPLAYED_FILL_PRIOR_WEIGHT = 1;

  /**
   * 未プレイ曲のBPIを、推定済みの潜在スキル a から予測する。
   *
   * a をそのまま使うと「1曲だけ全一・残りは未プレイ」のような少数観測でも
   * 全曲に対して強気な予測をしてしまい、原典由来の「この場合の総合BPIは
   * 50になる」という性質が大きく崩れる（実測: 約85まで跳ね上がる）。
   * そこで、推定の根拠となった観測量 den に応じて予測値を`BPI_FLOOR`(-15、
   * 「その曲を全く触っていない」という現行の扱い)とブレンドする
   * （w = den / (den + UNPLAYED_FILL_PRIOR_WEIGHT)）。den が大きい
   * （プレイ曲数が多く弁別力の高い曲を多く含む）プレイヤーほど予測を
   * そのまま信頼し、den が小さいプレイヤーほど「未プレイ＝-15」寄りに
   * 留まる。定数1は、上記の「1曲全一+残り未プレイ→50」がほぼ厳密に
   * 成り立つ点を基準に定めた（実測で50.00〜50.20程度に収まる）。
   */
  private static predictUnplayedBpi(
    a: number,
    den: number,
    song: NewBpiSongBasicData,
  ): number | null {
    const params = this.getSongParams(song);
    if (!params) return null;
    const { z0, z100, gamma } = params;
    const ratio = (a - z0) / (z100 - z0);
    const rawPrediction = 100 * Math.sign(ratio) * Math.pow(Math.abs(ratio), gamma);
    const w = den / (den + this.UNPLAYED_FILL_PRIOR_WEIGHT);
    const blended = w * rawPrediction + (1 - w) * this.BPI_FLOOR;
    return Math.max(this.BPI_FLOOR, Math.round(blended * 100) / 100);
  }

  /** シフト法（issue #297）の単曲BPI下限の絶対値。集約前後のシフト量として使う。 */
  private static readonly TOTAL_BPI_SHIFT = 15;

  /**
   * シフト法（issue #297）によるべき乗平均。単曲BPIの下限（-15）ぶんだけ
   * 全体をシフトしてから通常のべき乗平均を取り、最後に戻す。
   *
   * 符号付きの生のべき乗平均（`BpiCalculator.calculateTotalBPI`、現行実装）
   * は正側だけでなく負側でも極値に支配される（実質的に最良/最悪の1曲で
   * 総合が決まる）。このため、プレイ曲数が多く実力が平均よりやや低い程度の
   * プレイヤーでも、-15床に張り付く単曲BPIが数曲あるだけで総合BPIが
   * -15付近まで落ち込んでしまう（実測で確認済み: 潜在スキルa_iの推定値
   * からは本来もっと高い水準が見込めるにもかかわらず、-15〜-10帯に多数の
   * プレイヤーが集まる「壁」ができていた）。
   *
   * シフト法は指数を `k' = ln(n) / ln((100+c)/(50+c))` に再校正することで、
   * 「1曲全一・残りは未プレイ→総合50」という性質を厳密に保ったまま、
   * この極値支配を解消する（`docs/bpi-math.md` §4.3、issue #297 参照）。
   * 未プレイ曲の埋め（`predictUnplayedBpi`）で下限-15に寄せた値を渡しても
   * 崖を作らないため、新総合BPI（issue #304）の集約方式として採用する。
   */
  private static shiftedPowerMean(sortedDesc: number[], n: number): number {
    const c = this.TOTAL_BPI_SHIFT;
    const kPrime = Math.log(n) / Math.log((100 + c) / (50 + c));
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const bpi = i < sortedDesc.length ? sortedDesc[i] : this.BPI_FLOOR;
      sum += Math.pow(bpi + c, kPrime) / n;
    }
    return Math.round((Math.pow(sum, 1 / kPrime) - c) * 100) / 100;
  }

  /**
   * 総合BPI（issue #304）を、実際にプレイした曲の単曲BPIはそのまま使い、
   * 未プレイ曲だけを潜在スキル a_i からの予測値（{@link predictUnplayedBpi}）
   * で埋めたうえで、シフト法（{@link shiftedPowerMean}）で集約して算出する。
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
    const skill = this.estimateLatentSkillWithConfidence(observations);

    const bpis: number[] = [];
    for (const song of allSongs) {
      const exScore = exScoreBySongId.get(song.songId);
      if (exScore !== undefined) {
        const measured = this.calc(exScore, song);
        if (measured !== null) bpis.push(measured);
      } else if (skill !== null) {
        const predicted = this.predictUnplayedBpi(skill.a, skill.den, song);
        if (predicted !== null) bpis.push(predicted);
      }
    }
    if (bpis.length === 0) return null;

    bpis.sort((a, b) => b - a);
    return this.shiftedPowerMean(bpis, allSongs.length);
  }
}
