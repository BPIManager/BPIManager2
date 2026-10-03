/**
 * BPIオプティマイザの探索戦略・ヒューリスティクスの定数。BPI計算式の定数（z0・coefMedian等）は modelConstants 側が持つ。
 * 参照: docs/proposals/bpi-optimizer-v2-rebuild.md
 */
export const BpiOptimizerConstants = {
  /** 単曲BPIの下限（`@bpim/bpicalc`の`bpiFloor`既定値と同じ）。未プレイ曲の表示用フォールバック等に使う。 */
  BPI_FLOOR: -15,
  /** BPIの実務上の上限（表示・目標値バリデーション用。モデル自体は100超も数式上返しうるがクランプする）。 */
  MAX_BPI: 100,

  /**
   * 曲の目標BPI（ceiling）を見積もる際にz値へ足す上振れ幅。モデルが説明しない伸びしろを表す唯一の裁量パラメータ（提案書§3.4）。
   * 実測較正で 1.2 が両立点（0.3 は目標に届かず、3.0 は BPI=100 の非現実的な目標を要求した）。
   */
  GROWTH_MARGIN_Z: 1.2,

  /**
   * カテゴリ別バイアスを採用してよい信頼度の下限。w_c < 0.5 は事前分布由来が過半のためコールドとみなし推定しない（ColdStartGuard、提案書§3.7）。
   */
  CATEGORY_CONFIDENCE_THRESHOLD: 0.5,

  /** コールドなカテゴリについて「まずこれをプレイしてください」と提示する曲数。 */
  COLD_START_SUGGESTION_COUNT: 3,

  /** 候補の安価な一次選抜（解析的勾配ベース）を通過させ、厳密評価にかける上位件数。 */
  CANDIDATE_POOL_SIZE: 20,

  /**
   * flexible の候補選択で効率が同点付近のとき、未プレイ曲・現在の総合BPI未満の曲を優先するタイブレーク倍率（fastest では使わない）。
   * 主たる分散は candidateScorer.ts のペース配分が担う。
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
   * findOptimalBpiPath の既定リトライ回数。貪欲選択は厳密な差分で行うため、リトライは経路の多様性確保のみが目的で少数で足りる。
   */
  DEFAULT_MAX_RETRIES: 3,

  /** Fastestモードで最終選択時に対象とする上位プールサイズ（狭く、より貪欲に選ぶ）。 */
  POOL_SIZE_FASTEST: 5,
  /** Flexibleモードで最終選択時に対象とする上位プールサイズ（広く、多様性を持たせる）。 */
  POOL_SIZE_FLEXIBLE: 20,
  /** 乱数抽選時、上位の曲がより選ばれやすくなるよう乱数を偏らせる指数。 */
  POOL_PICK_POWER: 2,
} as const;
