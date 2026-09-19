import { ALL_RADAR_CATEGORIES } from "@/constants/iidx/radars";
import { BpiCalculator } from "@/lib/bpi";
import { BpiOptimizerConstants } from "./constants";
import { LatentSkillModel } from "./latentSkillModel";
import { TotalBpiEvaluator } from "./totalBpiEvaluator";
import { CandidateScorer, type ScoredCandidate } from "./candidateScorer";
import { detectColdCategories } from "./coldStartGuard";
import type {
  ExecuteOptions,
  OptimizationResult,
  OptimizationStep,
  SongOptimizerInput,
} from "@/types/bpi-optimizer";
import type { IBpiScoreObservation } from "@/types/songs/bpi";
import type { RadarCategory } from "@/types/stats/radar";

function roundBpi(value: number): number {
  return Math.round(value * 100) / 100;
}

/** 曲がレベル・難易度フィルタに合致するかを判定する。 */
function matchesFilters(song: SongOptimizerInput, options: ExecuteOptions): boolean {
  const levelOk =
    options.candidateLevels.length === 0 ||
    options.candidateLevels.includes(song.difficultyLevel);
  const diffOk =
    options.candidateDifficulties.length === 0 ||
    options.candidateDifficulties.includes(song.difficulty);
  return levelOk && diffOk;
}

/**
 * スコア付けされた候補のプールから、上位ほど選ばれやすい重み付き乱択で1曲決定する。
 * flexibleを完全一様乱択にすると寄与ほぼ0の候補まで選ばれうるため、両モードとも
 * `POOL_PICK_POWER`で上位寄りに偏らせ、プールサイズの違いだけでモード差を表す。
 */
function pickFromPool(
  scored: ScoredCandidate[],
  searchMode: "fastest" | "flexible" | undefined,
  rng: () => number,
): ScoredCandidate {
  const { POOL_SIZE_FASTEST, POOL_SIZE_FLEXIBLE, POOL_PICK_POWER } = BpiOptimizerConstants;
  const isFastest = searchMode === "fastest";
  const poolSize = isFastest ? POOL_SIZE_FASTEST : POOL_SIZE_FLEXIBLE;
  const topPool = scored.slice(0, Math.min(scored.length, poolSize));
  const pickIndex =
    topPool.length > 1
      ? Math.floor(Math.pow(rng(), POOL_PICK_POWER) * topPool.length)
      : 0;
  return topPool[pickIndex];
}

/**
 * BPI(V2)ネイティブの探索エンジン本体。
 * BPI計算式は一切再実装せず、`TotalBpiEvaluator`（＝`BpiCalculator`）と
 * `LatentSkillModel`（`@bpim/bpicalc`の`PlayerBpiV2`と同式の増分実装）にのみ依存する。
 * 責務は「ループを回し、`CandidateScorer`が選んだ曲を状態へ確定反映する」ことに絞る
 * （スコアリングの中身は`CandidateScorer`、目標BPIの見積もりは`achievementCeiling`が持つ）。
 */
class BpiOptimizerEngine {
  private readonly latentSkill = new LatentSkillModel();
  private readonly observations = new Map<number, IBpiScoreObservation>();
  private readonly totalEvaluator: TotalBpiEvaluator;
  private readonly scorer: CandidateScorer;
  private readonly rng: () => number;

  constructor(
    private readonly allSongs: SongOptimizerInput[],
    private readonly options: ExecuteOptions,
    private readonly targetTotalValue: number,
    private readonly maxSteps: number,
  ) {
    this.totalEvaluator = new TotalBpiEvaluator(allSongs.length);
    this.scorer = new CandidateScorer(this.totalEvaluator, this.latentSkill);
    this.rng = options.rng ?? Math.random;

    for (const song of allSongs) {
      if (song.currentExScore != null) {
        this.latentSkill.upsert(song, song.currentExScore);
        this.observations.set(song.songId, {
          songId: song.songId,
          notes: song.notes,
          exScore: song.currentExScore,
        });
      }
    }
  }

  execute(): OptimizationResult {
    if (this.allSongs.length === 0) {
      return {
        steps: [],
        currentTotalBpi: BpiOptimizerConstants.BPI_FLOOR,
        targetTotalBpi: this.targetTotalValue,
        achievable: false,
        alreadyAchieved: false,
        totalSongCount: 0,
      };
    }

    // シフト法の総合BPIは、未プレイ曲の潜在スキル予測が新しい観測で下振れすると
    // プレイ済み曲が1つも下がっていなくても下がりうるため、探索の起点をユーザーの
    // 既知の最高値（previousBestTotalBpi）でラチェットする（他画面の「現在の総合BPI」
    // と整合させる。BpiCalculator.ratchetTotalBpiのコメント参照）
    const initialTotal = BpiCalculator.ratchetTotalBpi(
      this.options.previousBestTotalBpi ?? null,
      this.totalEvaluator.exact([...this.observations.values()], this.allSongs),
    );

    if (initialTotal >= this.targetTotalValue) {
      return {
        steps: [],
        currentTotalBpi: roundBpi(initialTotal),
        targetTotalBpi: this.targetTotalValue,
        achievable: true,
        alreadyAchieved: true,
        totalSongCount: this.allSongs.length,
      };
    }

    const relevantCategories = this.options.radarElementFilter ?? ALL_RADAR_CATEGORIES;
    // コールド判定自体は常に行う（プレイ済み曲狙い主体の探索でも「このカテゴリは
    // データが薄い」という案内自体は有用なため）。候補からの除外（フィルタリング）
    // は未プレイ曲にのみ影響するので、includeUnplayedがfalseのときは実質無害。
    const coldCategories = detectColdCategories(
      relevantCategories as RadarCategory[],
      this.latentSkill,
      this.allSongs,
    );
    const coldSet = new Set(coldCategories.map((c) => c.category));

    const elementFilterSet = this.options.radarElementFilter
      ? new Set(this.options.radarElementFilter)
      : null;

    let candidates = this.allSongs.filter((song) => {
      if (elementFilterSet && (!song.radarCategory || !elementFilterSet.has(song.radarCategory))) {
        return false;
      }
      if (!matchesFilters(song, this.options)) return false;
      const isUnplayed = song.currentExScore == null;
      if (isUnplayed && !this.options.includeUnplayed) return false;
      if (!isUnplayed && !this.options.includePlayed) return false;
      if (isUnplayed && song.radarCategory && coldSet.has(song.radarCategory)) return false;
      return true;
    });

    if (candidates.length === 0) {
      return {
        steps: [],
        currentTotalBpi: roundBpi(initialTotal),
        targetTotalBpi: this.targetTotalValue,
        achievable: false,
        alreadyAchieved: false,
        totalSongCount: this.allSongs.length,
        coldCategories: coldCategories.length > 0 ? coldCategories : undefined,
      };
    }

    const steps: OptimizationStep[] = [];
    let currentTotal = initialTotal;

    while (
      currentTotal < this.targetTotalValue - BpiOptimizerConstants.ACHIEVED_BPI_MARGIN &&
      steps.length < this.maxSteps &&
      steps.length < BpiOptimizerConstants.ABSOLUTE_MAX_STEPS &&
      candidates.length > 0
    ) {
      const scored = this.scorer.scoreTopCandidates(
        candidates,
        this.observations,
        this.allSongs,
        currentTotal,
        this.targetTotalValue,
        this.options.considerCurrentTotalBpi !== false,
        this.options.searchMode,
        this.maxSteps - steps.length,
      );
      if (scored.length === 0) break;

      const picked = pickFromPool(scored, this.options.searchMode, this.rng);
      candidates = candidates.filter((c) => c.songId !== picked.song.songId);

      const isRadarStrength = picked.song.radarCategory
        ? this.latentSkill.categoryBias(picked.song.radarCategory) > 0
        : false;

      this.latentSkill.upsert(picked.song, picked.toExScore);
      this.observations.set(picked.song.songId, {
        songId: picked.song.songId,
        notes: picked.song.notes,
        exScore: picked.toExScore,
      });

      // 前ステップまでの到達値(currentTotal)を下回らないよう連鎖的にラチェットする
      // （initialTotal起点で既にprevious BestTotalBpi以上のため、これで全ステップが
      // 単調非減少になり、bpiGainが見かけ上マイナスになることもなくなる）
      const newTotal = BpiCalculator.ratchetTotalBpi(
        currentTotal,
        this.totalEvaluator.exact([...this.observations.values()], this.allSongs),
      );
      const fromBpi = picked.song.currentExScore != null ? picked.song.currentBpi : BpiOptimizerConstants.BPI_FLOOR;

      steps.push({
        rank: steps.length + 1,
        songId: picked.song.songId,
        title: picked.song.title,
        difficulty: picked.song.difficulty,
        difficultyLevel: picked.song.difficultyLevel,
        notes: picked.song.notes,
        fromBpi,
        toBpi: roundBpi(picked.actualToBpi),
        fromExScore: picked.song.currentExScore,
        toExScore: picked.toExScore,
        exScoreGap: picked.toExScore - (picked.song.currentExScore ?? 0),
        bpiGain: roundBpi(newTotal - currentTotal),
        cumulativeTotalBpi: roundBpi(newTotal),
        isUnplayed: picked.song.currentExScore == null,
        radarCategory: picked.song.radarCategory,
        isRadarStrength,
      });

      currentTotal = newTotal;
    }

    const achievable = currentTotal >= this.targetTotalValue - BpiOptimizerConstants.ACHIEVED_BPI_MARGIN;
    if (steps.length > 0 && achievable) {
      steps[steps.length - 1].cumulativeTotalBpi = roundBpi(this.targetTotalValue);
    }

    return {
      steps,
      currentTotalBpi: roundBpi(initialTotal),
      targetTotalBpi: this.targetTotalValue,
      achievable,
      alreadyAchieved: false,
      totalSongCount: this.allSongs.length,
      maxAchievableBpi: !achievable && steps.length > 0 ? steps[steps.length - 1].cumulativeTotalBpi : undefined,
      coldCategories: coldCategories.length > 0 ? coldCategories : undefined,
    };
  }
}

/**
 * 与えられた楽曲群の中で目標総合BPIへ到達するための最適なプレイパスを探索する。
 *
 * @param sourceData - 探索対象の全楽曲（プレイ済み・未プレイ問わず、潜在スキル推定にも使う）
 * @param targetTotalValue - 目標とする総合BPI値
 * @param options - 探索モード・戦略・フィルタなどの実行オプション
 * @param maxStepsInput - 提案する最大ステップ数（デフォルト: 30）
 */
export function findOptimalBpiPath(
  sourceData: SongOptimizerInput[],
  targetTotalValue: number,
  options: ExecuteOptions,
  maxStepsInput = 30,
): OptimizationResult {
  const { maxRetries = BpiOptimizerConstants.DEFAULT_MAX_RETRIES } = options;

  let bestResult: OptimizationResult | null = null;
  for (let i = 0; i < maxRetries; i++) {
    const result = new BpiOptimizerEngine(sourceData, options, targetTotalValue, maxStepsInput).execute();
    if (result.alreadyAchieved || result.achievable) return result;

    const currentMaxBpi = result.maxAchievableBpi ?? result.currentTotalBpi;
    const bestMaxBpi = bestResult ? (bestResult.maxAchievableBpi ?? bestResult.currentTotalBpi) : -Infinity;
    if (!bestResult || currentMaxBpi > bestMaxBpi) bestResult = result;

    // コールドスタート（候補ゼロ）や、母数0件は再試行しても結果が変わらないため打ち切る
    if (result.steps.length === 0 && result.coldCategories) break;
  }
  return bestResult as OptimizationResult;
}
