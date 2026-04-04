import { BpiCalculator } from "@/lib/bpi";
import type {
  SongOptimizerInput,
  OptimizationResult,
  OptimizerOptions,
  ExecuteOptions,
  ExecutionState,
  ResolvedTarget,
  ScoredCandidate,
} from "@/types/bpi-optimizer";
import { RadarCategory } from "@/types/stats/radar";

class BpiMath {
  /**
   * @param n - 対象となる全楽曲数
   * @param exponent - 計算に使用する指数
   */
  constructor(
    private readonly n: number,
    private readonly exponent: number,
  ) {}

  /**
   * 単一のBPI値から貢献度を計算
   *
   * @param value - 計算対象のBPI値
   * @returns 計算された貢献度
   */
  public contribution(value: number): number {
    const power = Math.pow(Math.abs(value), this.exponent) / this.n;
    return value > 0 ? power : -power;
  }

  /**
   * 貢献度の合計値から総合BPIを逆算
   *
   * @param sum - 貢献度の合計値
   * @returns 総合BPI
   */
  public totalFromSum(sum: number): number {
    if (sum === 0) return 0;
    const result = Math.pow(Math.abs(sum), 1 / this.exponent);
    return sum > 0 ? result : -result;
  }

  /**
   * 単一楽曲の貢献度から、その楽曲のBPIを逆算
   *
   * @param contribution - 単一楽曲の貢献度
   * @returns 逆算されたBPI値
   */
  public bpiFromContribution(contribution: number): number {
    const power = contribution * this.n;
    const result = Math.pow(Math.abs(power), 1 / this.exponent);
    return power > 0 ? result : -result;
  }

  /**
   * 指定した総合BPIに到達するために必要な貢献度の合計値を計算
   *
   * @param bpi - 目標とする総合BPI
   * @returns 必要な貢献度の合計値
   */
  public sumForBpi(bpi: number): number {
    return bpi > 0
      ? Math.pow(bpi, this.exponent)
      : -Math.pow(Math.abs(bpi), this.exponent);
  }
}

class BpiOptimizer {
  /** 1曲あたりの最小目標BPI上昇幅（これ以下の成長は無意味として弾く） */
  private static readonly MIN_BPI_GAIN = 0.5;
  /** 1曲あたりの最小目標EXスコア上昇幅 */
  private static readonly MIN_EX_GAIN = 5;
  /** Flexibleモード時、1ステップに要求する目標値のゆとり係数（1.15倍の余裕を持たせる） */
  private static readonly FLEXIBLE_BUFFER = 1.15;
  /** 無限ループを防止するための、システム的な絶対最大ステップ数 */
  private static readonly ABSOLUTE_MAX_STEPS = 600;

  /** 未プレイ（または実質未プレイ）とみなすBPIの閾値（-15以下） */
  private static readonly UNPLAYED_BPI_THRESHOLD = -15;
  /** BPIの理論上の上限値 */
  private static readonly MAX_BPI = 100;

  /** 指定ステップ数に対して目標が低すぎる場合、目標値を自動で引き上げる際の乗数 */
  private static readonly TARGET_RAISE_MULTIPLIER = 1.3;
  /** 目標値の自動引き上げを発動させるための、最低限必要な引き上げ幅のマージン */
  private static readonly TARGET_RAISE_MARGIN = 0.5;

  /** 得意レーダーのBPIから推定する、楽曲の到達限界BPIのプラスマージン */
  private static readonly CAP_RADAR_MARGIN = 3.0;
  /** 総合BPIから推定する、対象楽曲の到達限界BPIのプラスマージン */
  private static readonly CAP_TOTAL_MARGIN = 12.0;
  /** 対象楽曲の現在BPIに対して、最低限見込める到達限界BPIのプラスマージン */
  private static readonly CAP_BASE_MARGIN = 5.0;

  /** BPI上昇効率をスコア化する際、数値を扱いやすくするための乗数 */
  private static readonly SCORE_EFFICIENCY_MULTIPLIER = 1000;
  /** 未プレイ曲を優先して選出するためのスコア加算ボーナス */
  private static readonly SCORE_UNPLAYED_BONUS = 0.4;
  /** 得意なレーダー属性の曲を優先するためのスコア加算ボーナス */
  private static readonly SCORE_STRONG_CATEGORY_BONUS = 0.3;
  /** 苦手な属性の曲を避けるためのスコア減点係数 */
  private static readonly SCORE_WEAKNESS_PENALTY_COEF = 0.15;
  /** 苦手属性と判定して減点を開始する、目標値との差分閾値 */
  private static readonly SCORE_WEAKNESS_THRESHOLD = 10;

  /** Fastestモード時、上位何曲の中から抽選するかの定数 */
  private static readonly POOL_SIZE_FASTEST = 5;
  /** Flexibleモード時の抽選対象となる上位プールサイズ */
  private static readonly POOL_SIZE_FLEXIBLE = 20;
  /** 乱数抽選時、より上位の曲が選ばれやすくするための偏り */
  private static readonly POOL_PICK_POWER = 2;

  /** Fastestモードで未プレイ曲を引いた際の基礎到達BPIボーナス */
  private static readonly FASTEST_MODE_BONUS_BASE = 2.0;
  /** Fastestモードで未プレイ曲を引いた際に加算される、乱数による追加到達BPIボーナスの最大値 */
  private static readonly FASTEST_MODE_BONUS_RAND = 3.0;
  /** Flexibleモードで未プレイ曲を引いた際の、乱数ボーナスの最大値 */
  private static readonly FLEXIBLE_MODE_BONUS_RAND = 2.0;

  /** Fastestモードにおける、1曲での最大成長幅 */
  private static readonly GROWTH_MAX_BPI = 15.0;
  /** Fastestモードにおける、高BPI帯でも最低限保証する1曲の成長幅 */
  private static readonly GROWTH_MIN_BPI = 3.0;
  /** 現在のBPIに応じた成長限界を計算する際の基準値 */
  private static readonly GROWTH_BASE = 10.0;
  /** BPIが高くなるにつれて成長幅を減衰させるための除数 */
  private static readonly GROWTH_DIVISOR = 20;

  /** Flexibleモード時、限界値まで余裕がある場合の1ステップの成長上限 */
  private static readonly FLEXIBLE_LIMIT_HIGH = 8.0;
  /** Flexibleモード時、限界値が近い場合の1ステップの成長上限 */
  private static readonly FLEXIBLE_LIMIT_LOW = 3.0;
  /** 上記のHigh/Lowを切り替える、限界値との差分の閾値 */
  private static readonly FLEXIBLE_LIMIT_THRESHOLD = 15;

  /** 計算誤差による無限ループを防ぐための、目標値判定用の微小マージン */
  private static readonly EXEC_BPI_MARGIN = 0.001;
  /** 最終結果が「目標達成」したとみなすための、許容誤差マージン */
  private static readonly ACHIEVED_BPI_MARGIN = 0.05;

  /** 探索対象となる楽曲データの配列 */
  private readonly sourceData: SongOptimizerInput[];
  /** 総合BPIの母数となる全楽曲数 */
  private readonly n: number;
  /** ユーザーが指定する目標総合BPI */
  private readonly targetTotalValue: number;
  /** ユーザーが指定する実行オプション */
  private readonly options: ExecuteOptions;
  /** アルゴリズムが提案できる最大のステップ数 */
  private readonly maxSteps: number;
  /** BPIと貢献度を相互変換するクラス */
  private readonly math: BpiMath;
  /** 乱数生成器 */
  private readonly rng: () => number;

  /**
   * @param sourceData - 最適化の候補となる楽曲データの配列
   * @param totalCount - 総合BPI計算の母数となる全楽曲数
   * @param targetTotalValue - 目標とする総合BPI値
   * @param options - 探索モードやフィルタリングなどの実行オプション
   * @param maxSteps - 提案する最大ステップ数（デフォルト: 30）
   */
  constructor(
    sourceData: SongOptimizerInput[],
    totalCount: number,
    targetTotalValue: number,
    options: ExecuteOptions,
    maxSteps = 30,
  ) {
    this.sourceData = sourceData;
    this.n = totalCount;
    const exponent = Math.log2(totalCount) || 1;
    this.targetTotalValue = targetTotalValue;
    this.options = options;
    this.maxSteps = maxSteps;
    this.math = new BpiMath(totalCount, exponent);
    this.rng = options.rng ?? Math.random;
  }

  /**
   * 探索モードが「fastest（最短到達優先）」かどうかを判定
   */
  private get isFastest(): boolean {
    return this.options.searchMode === "fastest";
  }

  /**
   * 現在の総合BPIを限界能力値の計算に考慮するかどうかを判定
   */
  private get considerCurrentTotalBpi(): boolean {
    return this.options.considerCurrentTotalBpi !== false;
  }

  /**
   * BPI値を小数点第2位で四捨五入
   */
  private roundBpi(value: number): number {
    return Math.round(value * 100) / 100;
  }

  /**
   * ユーザーが得意とするレーダーカテゴリを抽出
   */
  private buildStrongCategories(): Set<RadarCategory> {
    const entries = Object.entries(this.options.radarCategoryBpis) as [
      RadarCategory,
      number,
    ][];

    return new Set(
      entries
        .filter(([, val]) => val != null)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([key]) => key),
    );
  }

  /**
   * オプションの条件（未プレイ・難易度・レーダーなど）に基づいて候補楽曲を絞り込み
   */
  private buildCandidates(
    elementFilterSet: Set<RadarCategory> | null,
  ): SongOptimizerInput[] {
    return this.sourceData.filter((s) => {
      const actualIsUnplayed =
        s.isUnplayed || s.currentBpi <= BpiOptimizer.UNPLAYED_BPI_THRESHOLD;
      if (elementFilterSet !== null) {
        if (!s.radarCategory || !elementFilterSet.has(s.radarCategory))
          return false;
      }
      if (!this.options.includeUnplayed && actualIsUnplayed) return false;
      if (!this.options.includePlayed && !actualIsUnplayed) return false;
      const isLevelMatch =
        this.options.candidateLevels.length === 0 ||
        this.options.candidateLevels.includes(s.difficultyLevel);
      const isDiffMatch =
        this.options.candidateDifficulties.length === 0 ||
        this.options.candidateDifficulties.includes(s.difficulty);
      return isLevelMatch && isDiffMatch;
    });
  }

  /**
   * 全候補楽曲の現在の貢献度の合計を計算
   */
  private computeInitialSum(): number {
    let sum = 0;
    for (const s of this.sourceData)
      sum += this.math.contribution(s.currentBpi);
    return sum;
  }

  /**
   * 設定されたステップ数や初期BPIを元に、最適な目標BPIを再計算・調整
   */
  private resolveTarget(
    initialSum: number,
    candidateCount: number,
  ): ResolvedTarget {
    const {
      MAX_BPI,
      TARGET_RAISE_MULTIPLIER,
      TARGET_RAISE_MARGIN,
      MIN_BPI_GAIN,
    } = BpiOptimizer;

    if (candidateCount === 0 || this.maxSteps <= 1) {
      return { effectiveTarget: this.targetTotalValue };
    }

    const initialTotal = this.math.totalFromSum(initialSum);
    const minViableContribPerStep = Math.abs(
      this.math.contribution(initialTotal + MIN_BPI_GAIN) -
        this.math.contribution(initialTotal),
    );

    const initialSumGap =
      this.math.sumForBpi(this.targetTotalValue) - initialSum;
    if (initialSumGap <= 0) return { effectiveTarget: this.targetTotalValue };

    const perStepContrib = initialSumGap / this.maxSteps;
    if (perStepContrib >= minViableContribPerStep)
      return { effectiveTarget: this.targetTotalValue };

    const raisedTargetSum =
      initialSum +
      minViableContribPerStep * this.maxSteps * TARGET_RAISE_MULTIPLIER;
    const raisedTarget = Math.min(
      MAX_BPI,
      this.math.totalFromSum(raisedTargetSum),
    );

    if (raisedTarget <= this.targetTotalValue + TARGET_RAISE_MARGIN)
      return { effectiveTarget: this.targetTotalValue };

    return {
      effectiveTarget: raisedTarget,
      originalTarget: this.targetTotalValue,
      autoAdjustmentNote: `指定された楽曲数ではより高い総合BPIが見込まれるため、自動的に目標総合BPIを${this.roundBpi(raisedTarget).toFixed(2)}へ引き上げました。`,
    };
  }

  /**
   * 対象楽曲をプレイした際に到達可能なBPIの限界値を計算
   */
  private computeCapabilities(
    fromBpi: number,
    radarBpi: number | null,
    currentTotalBpi: number,
  ): { humanCap: number; userCapability: number } {
    const { MAX_BPI, CAP_RADAR_MARGIN, CAP_TOTAL_MARGIN, CAP_BASE_MARGIN } =
      BpiOptimizer;

    const capBase = this.considerCurrentTotalBpi
      ? currentTotalBpi
      : this.targetTotalValue;
    const userCapability = Math.max(capBase, radarBpi ?? capBase);

    const humanCapBase = this.considerCurrentTotalBpi
      ? Math.min(
          MAX_BPI,
          radarBpi !== null
            ? Math.min(
                radarBpi + CAP_RADAR_MARGIN,
                currentTotalBpi + CAP_TOTAL_MARGIN,
              )
            : currentTotalBpi + CAP_TOTAL_MARGIN,
        )
      : MAX_BPI;
    const humanCap = Math.min(
      MAX_BPI,
      Math.max(humanCapBase, fromBpi + CAP_BASE_MARGIN),
    );

    return { humanCap, userCapability };
  }

  /**
   * 目標BPIの推定処理
   */
  private estimateTargetBpi(
    c: SongOptimizerInput,
    fromBpi: number,
    humanCap: number,
    userCapability: number,
    remainingSumGap: number,
    remainingSteps: number,
    isEffectivelyUnplayed: boolean,
  ): number {
    const {
      MIN_BPI_GAIN,
      FLEXIBLE_BUFFER,
      MAX_BPI,
      UNPLAYED_BPI_THRESHOLD,
      FASTEST_MODE_BONUS_BASE,
      FASTEST_MODE_BONUS_RAND,
      FLEXIBLE_MODE_BONUS_RAND,
    } = BpiOptimizer;

    let estimatedTargetBpi: number;

    if (isEffectivelyUnplayed) {
      const modeBonus = this.isFastest
        ? FASTEST_MODE_BONUS_BASE + this.rng() * FASTEST_MODE_BONUS_RAND
        : this.rng() * FLEXIBLE_MODE_BONUS_RAND;
      estimatedTargetBpi = Math.min(userCapability + modeBonus, humanCap);
    } else {
      const perStepGap =
        remainingSumGap /
        (remainingSteps * (this.isFastest ? 1.0 : FLEXIBLE_BUFFER));
      estimatedTargetBpi = this.math.bpiFromContribution(
        this.math.contribution(fromBpi) + perStepGap,
      );
      estimatedTargetBpi = Math.min(estimatedTargetBpi, humanCap);
    }

    estimatedTargetBpi = Math.max(
      estimatedTargetBpi,
      fromBpi + MIN_BPI_GAIN,
      UNPLAYED_BPI_THRESHOLD,
    );
    return Math.min(estimatedTargetBpi, MAX_BPI);
  }

  /**
   * 効率性の計算
   */
  private calcEfficiency(
    c: SongOptimizerInput,
    fromBpi: number,
    estimatedTargetBpi: number,
  ): { efficiency: number } | null {
    const { MIN_BPI_GAIN, MIN_EX_GAIN } = BpiOptimizer;

    const contribIncrease = Math.max(
      0,
      this.math.contribution(estimatedTargetBpi) -
        this.math.contribution(fromBpi),
    );

    const estimatedToEx = BpiCalculator.calcFromBPI(estimatedTargetBpi, {
      notes: c.notes,
      kaidenAvg: c.kaidenAvg,
      wrScore: c.wrScore,
      coef: c.coef,
    });
    const currentEx = c.currentExScore ?? 0;
    const estimatedExGain = Math.max(1, estimatedToEx - currentEx);
    const estimatedBpiGain = estimatedTargetBpi - fromBpi;

    if (estimatedExGain < MIN_EX_GAIN && estimatedBpiGain < MIN_BPI_GAIN)
      return null;

    return { efficiency: contribIncrease / estimatedExGain };
  }

  /**
   * ヒューリスティクス適用
   */
  private applyHeuristics(
    baseEfficiency: number,
    c: SongOptimizerInput,
    radarBpi: number | null,
    currentTotalBpi: number,
    strongCategories: Set<RadarCategory>,
    isEffectivelyUnplayed: boolean,
  ): number {
    const {
      SCORE_EFFICIENCY_MULTIPLIER,
      SCORE_UNPLAYED_BONUS,
      SCORE_STRONG_CATEGORY_BONUS,
      SCORE_WEAKNESS_PENALTY_COEF,
      SCORE_WEAKNESS_THRESHOLD,
    } = BpiOptimizer;

    let score = baseEfficiency * SCORE_EFFICIENCY_MULTIPLIER;

    if (isEffectivelyUnplayed) score += SCORE_UNPLAYED_BONUS;
    if (c.radarCategory && strongCategories.has(c.radarCategory))
      score += SCORE_STRONG_CATEGORY_BONUS;
    if (radarBpi !== null) {
      const weakness = currentTotalBpi - radarBpi;
      if (weakness > SCORE_WEAKNESS_THRESHOLD) {
        score -=
          SCORE_WEAKNESS_PENALTY_COEF * (weakness / SCORE_WEAKNESS_THRESHOLD);
      }
    }

    return score;
  }

  /**
   * 1つの候補楽曲に対して、BPI上昇の効率性や得意傾向に基づいたスコアを計算
   *
   * @param c - 評価対象の楽曲データ
   * @param remainingSumGap - 目標到達までに必要な貢献度の残り
   * @param remainingSteps - 残りのステップ（楽曲）数
   * @param currentTotalBpi - 現在の総合BPI
   * @param strongCategories - ユーザーの得意なレーダーカテゴリのSet
   * @returns スコア計算結果（効率が悪すぎる場合はnull）
   */
  private scoreOneCandidate(
    c: SongOptimizerInput,
    remainingSumGap: number,
    remainingSteps: number,
    currentTotalBpi: number,
    strongCategories: Set<RadarCategory>,
  ): ScoredCandidate | null {
    const fromBpi = c.currentBpi;
    const radarBpi =
      c.radarCategory != null
        ? (this.options.radarCategoryBpis[c.radarCategory] ?? null)
        : null;
    const { humanCap, userCapability } = this.computeCapabilities(
      fromBpi,
      radarBpi,
      currentTotalBpi,
    );

    const isEffectivelyUnplayed =
      c.isUnplayed || fromBpi <= BpiOptimizer.UNPLAYED_BPI_THRESHOLD;

    const estimatedTargetBpi = this.estimateTargetBpi(
      c,
      fromBpi,
      humanCap,
      userCapability,
      remainingSumGap,
      remainingSteps,
      isEffectivelyUnplayed,
    );

    const efficiencyResult = this.calcEfficiency(
      c,
      fromBpi,
      estimatedTargetBpi,
    );
    if (!efficiencyResult) return null;

    const score = this.applyHeuristics(
      efficiencyResult.efficiency,
      c,
      radarBpi,
      currentTotalBpi,
      strongCategories,
      isEffectivelyUnplayed,
    );

    return { song: c, score, estimatedTargetBpi };
  }

  /**
   * スコア付けされた候補のプールから、乱数を用いて1曲を決定
   */
  private pickFromPool(scored: ScoredCandidate[]): ScoredCandidate {
    const { POOL_SIZE_FASTEST, POOL_SIZE_FLEXIBLE, POOL_PICK_POWER } =
      BpiOptimizer;

    scored.sort((a, b) => b.score - a.score);
    const poolSize = this.isFastest ? POOL_SIZE_FASTEST : POOL_SIZE_FLEXIBLE;
    const topPool = scored.slice(0, Math.min(scored.length, poolSize));
    const pickIndex =
      topPool.length > 1
        ? this.isFastest
          ? Math.floor(Math.pow(this.rng(), POOL_PICK_POWER) * topPool.length)
          : Math.floor(this.rng() * topPool.length)
        : 0;
    return topPool[pickIndex];
  }

  /**
   * 選出された楽曲について、理論上到達すべき目標BPIを計算
   */
  private computeTheoreticalBpi(
    pickedSong: SongOptimizerInput,
    remainingSumGap: number,
    remainingSteps: number,
    humanCap: number,
    userCapability: number,
    isLastStep: boolean,
  ): number {
    const {
      MIN_BPI_GAIN,
      FLEXIBLE_BUFFER,
      MAX_BPI,
      UNPLAYED_BPI_THRESHOLD,
      GROWTH_MAX_BPI,
      GROWTH_MIN_BPI,
      GROWTH_BASE,
      GROWTH_DIVISOR,
      FLEXIBLE_LIMIT_HIGH,
      FLEXIBLE_LIMIT_LOW,
      FLEXIBLE_LIMIT_THRESHOLD,
      FLEXIBLE_MODE_BONUS_RAND,
    } = BpiOptimizer;

    const fromBpi = pickedSong.currentBpi;
    const isEffectivelyUnplayed =
      pickedSong.isUnplayed || fromBpi <= UNPLAYED_BPI_THRESHOLD;

    let theoreticalNextBpi: number;

    if (this.isFastest) {
      const growthPotential =
        fromBpi < 0
          ? GROWTH_MAX_BPI
          : Math.max(GROWTH_MIN_BPI, GROWTH_BASE - fromBpi / GROWTH_DIVISOR);
      const requiredBpi = this.math.bpiFromContribution(
        this.math.contribution(fromBpi) + remainingSumGap,
      );
      theoreticalNextBpi = Math.min(
        requiredBpi,
        humanCap,
        fromBpi + growthPotential,
      );
      theoreticalNextBpi = Math.max(theoreticalNextBpi, fromBpi + MIN_BPI_GAIN);
    } else {
      if (isEffectivelyUnplayed) {
        theoreticalNextBpi = Math.min(
          userCapability + this.rng() * FLEXIBLE_MODE_BONUS_RAND,
          humanCap,
        );
        theoreticalNextBpi = Math.max(
          theoreticalNextBpi,
          fromBpi + MIN_BPI_GAIN,
        );
      } else {
        const targetStepSum =
          remainingSumGap / (remainingSteps * FLEXIBLE_BUFFER);
        const idealNextBpi = this.math.bpiFromContribution(
          this.math.contribution(fromBpi) + targetStepSum,
        );
        const flexibleLimit =
          userCapability - fromBpi > FLEXIBLE_LIMIT_THRESHOLD
            ? FLEXIBLE_LIMIT_HIGH
            : FLEXIBLE_LIMIT_LOW;
        theoreticalNextBpi = Math.min(
          idealNextBpi,
          fromBpi + flexibleLimit + this.rng(),
          humanCap,
        );
        theoreticalNextBpi = Math.max(
          theoreticalNextBpi,
          fromBpi + MIN_BPI_GAIN,
        );
      }

      if (isLastStep) {
        const closingBpi = this.math.bpiFromContribution(
          this.math.contribution(fromBpi) + remainingSumGap,
        );
        if (closingBpi <= humanCap && closingBpi > fromBpi + MIN_BPI_GAIN) {
          theoreticalNextBpi = closingBpi;
        }
      }
    }

    return Math.min(MAX_BPI, theoreticalNextBpi);
  }

  /**
   * 理論上のBPIから実際のEXスコアへ変換し、端数による誤差を管理
   */
  private resolveExScore(
    pickedSong: SongOptimizerInput,
    theoreticalBpi: number,
    currentEx: number,
    carryError: number,
  ): { toExScore: number; newCarryError: number } {
    const { MIN_EX_GAIN } = BpiOptimizer;
    const rawToExFloat =
      BpiCalculator.calcFromBPI(theoreticalBpi, {
        notes: pickedSong.notes,
        kaidenAvg: pickedSong.kaidenAvg,
        wrScore: pickedSong.wrScore,
        coef: pickedSong.coef,
      }) + carryError;

    let toExScore = Math.round(rawToExFloat);
    let newCarryError = rawToExFloat - toExScore;

    if (toExScore < currentEx + MIN_EX_GAIN) {
      toExScore = currentEx + MIN_EX_GAIN;
      newCarryError = 0;
    }

    const maxScore = pickedSong.notes * 2;
    if (toExScore > maxScore) {
      toExScore = maxScore;
      newCarryError = 0;
    }

    return { toExScore, newCarryError };
  }

  /**
   * 探索の継続判定
   */
  private shouldContinue(state: ExecutionState): boolean {
    return (
      state.currentTotalBpi <
        state.effectiveTarget - BpiOptimizer.EXEC_BPI_MARGIN &&
      state.steps.length < this.maxSteps &&
      state.steps.length < BpiOptimizer.ABSOLUTE_MAX_STEPS
    );
  }

  /**
   * 最適化の1ステップを実行し、状態を更新
   *
   * @param state - 現在の実行状態
   * @returns 次のステップが実行可能かどうか
   */
  private runStep(state: ExecutionState): boolean {
    const remainingPool = state.candidates.filter(
      (c) => !state.usedIds.has(c.songId),
    );
    if (remainingPool.length === 0) return false;

    const remainingSteps = Math.max(1, this.maxSteps - state.steps.length);
    const remainingSumGap = state.totalTargetSum - state.currentAccumulatedSum;

    const scored = remainingPool
      .map((c) =>
        this.scoreOneCandidate(
          c,
          remainingSumGap,
          remainingSteps,
          state.currentTotalBpi,
          state.strongCategories,
        ),
      )
      .filter((s): s is ScoredCandidate => s !== null);

    if (scored.length === 0) return false;

    const { song: pickedSong } = this.pickFromPool(scored);
    const fromBpi = pickedSong.currentBpi;
    const radarBpi =
      pickedSong.radarCategory != null
        ? (this.options.radarCategoryBpis[pickedSong.radarCategory] ?? null)
        : null;

    const { humanCap, userCapability } = this.computeCapabilities(
      fromBpi,
      radarBpi,
      state.currentTotalBpi,
    );

    const isLastStep =
      state.steps.length === this.maxSteps - 1 || remainingPool.length === 1;

    const theoreticalNextBpi = this.computeTheoreticalBpi(
      pickedSong,
      remainingSumGap,
      remainingSteps,
      humanCap,
      userCapability,
      isLastStep,
    );

    const currentEx = pickedSong.currentExScore ?? 0;
    const { toExScore, newCarryError } = this.resolveExScore(
      pickedSong,
      theoreticalNextBpi,
      currentEx,
      state.carryError,
    );
    state.carryError = newCarryError;

    const exGain = toExScore - currentEx;
    const actualNextBpiRaw = BpiCalculator.calc(toExScore, {
      notes: pickedSong.notes,
      kaidenAvg: pickedSong.kaidenAvg,
      wrScore: pickedSong.wrScore,
      coef: pickedSong.coef,
    });
    const actualNextBpi = actualNextBpiRaw ?? fromBpi;

    if (
      exGain < BpiOptimizer.MIN_EX_GAIN &&
      actualNextBpi - fromBpi < BpiOptimizer.MIN_BPI_GAIN
    ) {
      state.usedIds.add(pickedSong.songId);
      return true;
    }

    state.currentAccumulatedSum +=
      this.math.contribution(actualNextBpi) - this.math.contribution(fromBpi);
    const nextTotalBpi = this.math.totalFromSum(state.currentAccumulatedSum);

    state.steps.push({
      rank: state.steps.length + 1,
      songId: pickedSong.songId,
      title: pickedSong.title,
      difficulty: pickedSong.difficulty,
      difficultyLevel: pickedSong.difficultyLevel,
      fromBpi,
      toBpi: this.roundBpi(actualNextBpi),
      fromExScore: pickedSong.currentExScore,
      toExScore,
      exScoreGap: exGain,
      bpiGain: this.roundBpi(nextTotalBpi - state.currentTotalBpi),
      cumulativeTotalBpi: this.roundBpi(nextTotalBpi),
      isUnplayed: fromBpi <= BpiOptimizer.UNPLAYED_BPI_THRESHOLD,
      radarCategory: pickedSong.radarCategory,
      isRadarStrength: !!(
        pickedSong.radarCategory &&
        state.strongCategories.has(pickedSong.radarCategory)
      ),
    });

    state.currentTotalBpi = nextTotalBpi;
    state.usedIds.add(pickedSong.songId);

    return true;
  }

  /**
   * ループ終了後の最終的な結果を構築
   */
  private finalize(
    state: ExecutionState,
    initialTotal: number,
    effectiveTarget: number,
    originalTarget: number | undefined,
    autoAdjustmentNote: string | undefined,
  ): OptimizationResult {
    const isAchievable =
      state.currentTotalBpi >=
      effectiveTarget - BpiOptimizer.ACHIEVED_BPI_MARGIN;
    const maxAchievableBpi =
      state.steps.length > 0
        ? state.steps[state.steps.length - 1].cumulativeTotalBpi
        : this.roundBpi(initialTotal);

    if (state.steps.length > 0 && isAchievable) {
      state.steps[state.steps.length - 1].cumulativeTotalBpi =
        this.roundBpi(effectiveTarget);
    }

    return {
      steps: state.steps,
      currentTotalBpi: this.roundBpi(initialTotal),
      targetTotalBpi: effectiveTarget,
      originalTargetTotalBpi: originalTarget,
      achievable: isAchievable,
      alreadyAchieved: false,
      totalSongCount: this.n,
      autoAdjustmentNote,
      maxAchievableBpi: !isAchievable ? maxAchievableBpi : undefined,
    };
  }

  /**
   * 最適化を1回実行し、目標へ向けたプレイパスのリストを生成
   */
  private execute(): OptimizationResult {
    const { UNPLAYED_BPI_THRESHOLD } = BpiOptimizer;

    if (this.n === 0) {
      return {
        steps: [],
        currentTotalBpi: UNPLAYED_BPI_THRESHOLD,
        targetTotalBpi: this.targetTotalValue,
        achievable: false,
        alreadyAchieved: false,
        totalSongCount: 0,
      };
    }

    const strongCategories = this.buildStrongCategories();
    const elementFilterSet =
      this.options.radarElementFilter !== null
        ? new Set(this.options.radarElementFilter)
        : null;
    const candidates = this.buildCandidates(elementFilterSet);

    const initialSum = this.computeInitialSum();
    const initialTotal = this.math.totalFromSum(initialSum);

    if (initialTotal >= this.targetTotalValue) {
      return {
        steps: [],
        currentTotalBpi: this.roundBpi(initialTotal),
        targetTotalBpi: this.targetTotalValue,
        achievable: true,
        alreadyAchieved: true,
        totalSongCount: this.n,
      };
    }

    const { effectiveTarget, autoAdjustmentNote, originalTarget } =
      this.resolveTarget(initialSum, candidates.length);

    const state: ExecutionState = {
      steps: [],
      usedIds: new Set<number>(),
      currentAccumulatedSum: initialSum,
      currentTotalBpi: initialTotal,
      carryError: 0,
      effectiveTarget,
      totalTargetSum: this.math.sumForBpi(effectiveTarget),
      candidates,
      strongCategories,
    };

    while (this.shouldContinue(state)) {
      const hasNext = this.runStep(state);
      if (!hasNext) break;
    }

    return this.finalize(
      state,
      initialTotal,
      effectiveTarget,
      originalTarget,
      autoAdjustmentNote,
    );
  }

  /**
   * 指定された回数だけ最適化を試行し、最も良い結果（目標到達、または最高到達点）を返す
   *
   * @param maxRetries - 最大試行回数（デフォルト: 10）
   * @returns 最も高い総合BPIに到達した最適化パスの結果
   */
  public findOptimalPath(maxRetries = 10): OptimizationResult {
    let bestResult: OptimizationResult | null = null;

    for (let i = 0; i < maxRetries; i++) {
      const result = this.execute();

      if (result.alreadyAchieved || result.achievable) return result;

      const currentMaxBpi = result.maxAchievableBpi ?? result.currentTotalBpi;
      const bestMaxBpi = bestResult
        ? (bestResult.maxAchievableBpi ?? bestResult.currentTotalBpi)
        : -Infinity;

      if (!bestResult || currentMaxBpi > bestMaxBpi) bestResult = result;
    }

    return bestResult as OptimizationResult;
  }
}

/**
 * 与えられた楽曲群の中で目標総合BPIへ到達するための最適なプレイパスを探索する
 *
 * @param sourceData - 最適化の候補となる楽曲データの配列
 * @param totalCount - 総合BPI計算の母数となる全楽曲数
 * @param targetTotalValue - 目標とする総合BPI値
 * @param options - 探索モード（fastest/flexible）、再試行回数、RNGなどのオプション
 * @param maxStepsInput - 提案する最大ステップ数（デフォルト: 30）
 * @returns 最適化された楽曲プレイ手順や到達結果を含むオブジェクト
 */
export function findOptimalBpiPath(
  sourceData: SongOptimizerInput[],
  totalCount: number,
  targetTotalValue: number,
  options: OptimizerOptions & {
    searchMode?: "fastest" | "flexible";
    maxRetries?: number;
    rng?: () => number;
  },
  maxStepsInput = 30,
): OptimizationResult {
  const { maxRetries = 10, ...executeOptions } = options;
  return new BpiOptimizer(
    sourceData,
    totalCount,
    targetTotalValue,
    executeOptions,
    maxStepsInput,
  ).findOptimalPath(maxRetries);
}
