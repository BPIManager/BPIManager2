/**
 * BPIオプティマイザ（BPI(V2)ネイティブ探索エンジン）固有の定数。
 * BPI計算式そのものの定数（z0/z100/coefMedian等）は含まない
 * （それらは`@/constants/iidx/newBpi/modelConstants`が持ち、`BpiCalculator`経由で使う）。
 * ここにあるのは「探索戦略・ヒューリスティクス」という製品判断の定数のみ。
 *
 * 参照: docs/proposals/bpi-optimizer-v2-rebuild.md
 */
export const BpiOptimizerConstants = {
  /** 単曲BPIの下限（`@bpim/bpicalc`の`bpiFloor`既定値と同じ）。未プレイ曲の表示用フォールバック等に使う。 */
  BPI_FLOOR: -15,
  /** BPIの実務上の上限（表示・目標値バリデーション用。モデル自体は100超も数式上返しうるがクランプする）。 */
  MAX_BPI: 100,

  /**
   * 曲の目標BPI（ceiling）を見積もる際、z値（潜在能力スケール）に足す上振れ幅
   * （「モデルが説明しない伸びしろ」の唯一の裁量パラメータ、提案書§3.4）。
   * 実測較正: `0.3`は小さな目標ギャップ(+3)すら未達成になるほど過小、`3.0`は
   * 個々の曲にBPI=100(WR相当)という非現実的な目標を要求した。`1.2`が両立点。
   */
  GROWTH_MARGIN_Z: 1.2,

  /**
   * カテゴリ別の得意・不得意バイアス`categoryBias_c`を採用してよいと判断する信頼度の下限。
   * `w_c = info_c/(info_c+1)`（事後分散の補数）が`0.5`未満＝「そのカテゴリの推定の半分以上が
   * 事前分布（＝カテゴリ差なし）由来」の場合はコールドとみなし、無理に推定しない
   * （`ColdStartGuard`、提案書§3.7）。
   */
  CATEGORY_CONFIDENCE_THRESHOLD: 0.5,

  /** コールドなカテゴリについて「まずこれをプレイしてください」と提示する曲数。 */
  COLD_START_SUGGESTION_COUNT: 3,

  /** 候補の安価な一次選抜（解析的勾配ベース）を通過させ、厳密評価にかける上位件数。 */
  CANDIDATE_POOL_SIZE: 20,

  /**
   * flexibleモードの候補選択で、効率が同点付近のときに「未プレイ曲」「現在の
   * 総合BPI未満の曲」を優先するタイブレーク用倍率ボーナス（fastestでは使わない）。
   * 主たる分散の仕組みは`candidateScorer.ts`のペース配分。
   */
  /** 未プレイ曲への効率ランキングの倍率ボーナス（+50%）。 */
  DIVERSITY_UNPLAYED_BONUS: 0.5,
  /** 現在の総合BPIをまだ下回っている曲への効率ランキングの倍率ボーナス（+50%）。 */
  DIVERSITY_HEADROOM_BONUS: 0.5,

  /** 1曲あたりに要求する最小EXスコア増分（これ未満の提案は無意味として弾く）。 */
  MIN_EX_GAIN: 5,
  /** 1曲あたりに要求する最小BPI増分（EXスコア増分がわずかでもBPIが十分伸びるなら許容する）。 */
  MIN_BPI_GAIN: 0.5,

  /** 目標総合BPIに到達したとみなす許容誤差（丸め誤差吸収用）。 */
  ACHIEVED_BPI_MARGIN: 0.05,

  /** 無限ループ防止のための、システム的な絶対最大ステップ数（`maxSteps`パラメータの上限とは別）。 */
  ABSOLUTE_MAX_STEPS: 600,

  /**
   * findOptimalBpiPathの既定リトライ回数。
   * 厳密な総合BPI差分に基づく貪欲選択（`CandidateScorer`）を使うため、V1時代のような
   * 「ノイズの多いヒューリスティクスを数十〜百回試して良い方を拾う」目的のリトライは不要になった。
   * ここでのリトライは「毎回同じ経路にならない」多様性確保のみが目的なので少数で十分。
   */
  DEFAULT_MAX_RETRIES: 3,

  /** Fastestモードで最終選択時に対象とする上位プールサイズ（狭く、より貪欲に選ぶ）。 */
  POOL_SIZE_FASTEST: 5,
  /** Flexibleモードで最終選択時に対象とする上位プールサイズ（広く、多様性を持たせる）。 */
  POOL_SIZE_FLEXIBLE: 20,
  /** 乱数抽選時、上位の曲がより選ばれやすくなるよう乱数を偏らせる指数。 */
  POOL_PICK_POWER: 2,
} as const;
