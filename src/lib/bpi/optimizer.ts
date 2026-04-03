import { BpiCalculator } from "@/lib/bpi";
import type {
  SongOptimizerInput,
  OptimizationStep,
  OptimizationResult,
  OptimizerOptions,
} from "@/types/bpi-optimizer";

function calculateContribution(
  value: number,
  exponent: number,
  count: number,
): number {
  const power = Math.pow(Math.abs(value), exponent) / count;
  return value > 0 ? power : -power;
}

function calculateTotalFromSum(sum: number, exponent: number): number {
  if (sum === 0) return 0;
  const result = Math.pow(Math.abs(sum), 1 / exponent);
  return sum > 0 ? result : -result;
}

function calculateBpiFromContribution(
  contribution: number,
  exponent: number,
  count: number,
): number {
  const power = contribution * count;
  const result = Math.pow(Math.abs(power), 1 / exponent);
  return power > 0 ? result : -result;
}

function targetSumForBpi(bpi: number, exponent: number): number {
  return bpi > 0 ? Math.pow(bpi, exponent) : -Math.pow(Math.abs(bpi), exponent);
}

const MIN_BPI_GAIN = 0.5;
const MIN_EX_GAIN = 5;
const FLEXIBLE_BUFFER = 1.15;

function executeOptimization(
  sourceData: SongOptimizerInput[],
  totalCount: number,
  targetTotalValue: number,
  options: OptimizerOptions & { searchMode?: "fastest" | "flexible" },
  maxStepsInput = 30,
): OptimizationResult {
  if (totalCount === 0) {
    return {
      steps: [],
      currentTotalBpi: -15,
      targetTotalBpi: targetTotalValue,
      achievable: false,
      alreadyAchieved: false,
      totalSongCount: 0,
    };
  }

  const exponent = Math.log2(totalCount) || 1;
  const n = totalCount;
  const isFastest = options.searchMode === "fastest";
  const considerCurrentTotalBpi = options.considerCurrentTotalBpi !== false;

  const validRadarEntries = Object.entries(options.radarCategoryBpis).filter(
    ([, val]) => val !== undefined && val !== null,
  ) as [string, number][];
  validRadarEntries.sort((a, b) => b[1] - a[1]);
  const strongCategories = new Set(
    validRadarEntries.slice(0, 3).map((e) => e[0]),
  );

  const elementFilterSet =
    options.radarElementFilter !== null
      ? new Set(options.radarElementFilter)
      : null;

  const candidates = sourceData.filter((s) => {
    const actualIsUnplayed = s.isUnplayed || s.currentBpi <= -15;
    if (elementFilterSet !== null) {
      if (!s.radarCategory || !elementFilterSet.has(s.radarCategory))
        return false;
    }
    if (!options.includeUnplayed && actualIsUnplayed) return false;
    if (!options.includePlayed && !actualIsUnplayed) return false;
    const isLevelMatch =
      options.candidateLevels.length === 0 ||
      options.candidateLevels.includes(s.difficultyLevel);
    const isDiffMatch =
      options.candidateDifficulties.length === 0 ||
      options.candidateDifficulties.includes(s.difficulty);
    return isLevelMatch && isDiffMatch;
  });

  let initialSum = 0;
  for (const s of sourceData) {
    initialSum += calculateContribution(s.currentBpi, exponent, n);
  }
  const initialTotal = calculateTotalFromSum(initialSum, exponent);

  if (initialTotal >= targetTotalValue) {
    return {
      steps: [],
      currentTotalBpi: Math.round(initialTotal * 100) / 100,
      targetTotalBpi: targetTotalValue,
      achievable: true,
      alreadyAchieved: true,
      totalSongCount: n,
    };
  }

  const minViableContribPerStep = Math.abs(
    calculateContribution(initialTotal + MIN_BPI_GAIN, exponent, n) -
      calculateContribution(initialTotal, exponent, n),
  );

  let effectiveTargetValue = targetTotalValue;
  let autoAdjustmentNote: string | undefined;
  let originalTargetTotalBpi: number | undefined;

  if (candidates.length > 0 && maxStepsInput > 1) {
    const initialSumGap =
      targetSumForBpi(targetTotalValue, exponent) - initialSum;
    if (initialSumGap > 0) {
      const perStepContrib = initialSumGap / maxStepsInput;
      if (perStepContrib < minViableContribPerStep) {
        const raisedTargetSum =
          initialSum + minViableContribPerStep * maxStepsInput * 1.3;
        const raisedTarget = Math.min(
          100,
          calculateTotalFromSum(raisedTargetSum, exponent),
        );
        if (raisedTarget > targetTotalValue + 0.5) {
          originalTargetTotalBpi = targetTotalValue;
          effectiveTargetValue = raisedTarget;
          autoAdjustmentNote = `指定された楽曲数ではより高い総合BPIが見込まれるため、自動的に目標総合BPIを${raisedTarget.toFixed(2)}へ引き上げました。`;
        }
      }
    }
  }

  const totalTargetSum = targetSumForBpi(effectiveTargetValue, exponent);

  const steps: OptimizationStep[] = [];
  const usedIds = new Set<number>();
  let currentAccumulatedSum = initialSum;
  let currentTotalBpi = initialTotal;
  let carryError = 0;

  const ABSOLUTE_MAX_STEPS = 600;

  while (
    currentTotalBpi < effectiveTargetValue - 0.001 &&
    steps.length < maxStepsInput &&
    steps.length < ABSOLUTE_MAX_STEPS
  ) {
    const remainingPool = candidates.filter((c) => !usedIds.has(c.songId));
    if (remainingPool.length === 0) break;

    const remainingSteps = Math.max(1, maxStepsInput - steps.length);
    const remainingSumGap = totalTargetSum - currentAccumulatedSum;

    type ScoredCandidate = {
      song: SongOptimizerInput;
      score: number;
      estimatedTargetBpi: number;
    };

    const scored: ScoredCandidate[] = [];

    for (const c of remainingPool) {
      const fromBpi = c.currentBpi;
      const radarBpi =
        c.radarCategory != null
          ? (options.radarCategoryBpis[c.radarCategory] ?? null)
          : null;
      const capBase = considerCurrentTotalBpi
        ? currentTotalBpi
        : targetTotalValue;
      const userCapability = Math.max(capBase, radarBpi ?? capBase);

      const humanCapBase = considerCurrentTotalBpi
        ? Math.min(
            100,
            radarBpi !== null
              ? Math.min(radarBpi + 3.0, currentTotalBpi + 12.0)
              : currentTotalBpi + 12.0,
          )
        : 100;
      const humanCap = Math.min(100, Math.max(humanCapBase, fromBpi + 5.0));

      let estimatedTargetBpi: number;
      const isEffectivelyUnplayed = c.isUnplayed || fromBpi <= -15;

      if (isEffectivelyUnplayed) {
        const modeBonus = isFastest
          ? 2.0 + Math.random() * 3.0
          : Math.random() * 2.0;
        estimatedTargetBpi = Math.min(userCapability + modeBonus, humanCap);
      } else {
        const perStepGap =
          remainingSumGap /
          (remainingSteps * (isFastest ? 1.0 : FLEXIBLE_BUFFER));
        estimatedTargetBpi = calculateBpiFromContribution(
          calculateContribution(fromBpi, exponent, n) + perStepGap,
          exponent,
          n,
        );
        estimatedTargetBpi = Math.min(estimatedTargetBpi, humanCap);
      }

      estimatedTargetBpi = Math.max(
        estimatedTargetBpi,
        fromBpi + MIN_BPI_GAIN,
        -15,
      );
      estimatedTargetBpi = Math.min(estimatedTargetBpi, 100);

      const contribIncrease = Math.max(
        0,
        calculateContribution(estimatedTargetBpi, exponent, n) -
          calculateContribution(fromBpi, exponent, n),
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
      if (estimatedExGain < MIN_EX_GAIN && estimatedBpiGain < MIN_BPI_GAIN) {
        continue;
      }

      const efficiency = contribIncrease / estimatedExGain;

      let score = efficiency * 1000;

      if (isEffectivelyUnplayed) score += 0.4;

      if (c.radarCategory && strongCategories.has(c.radarCategory)) {
        score += 0.3;
      }

      if (radarBpi !== null) {
        const weakness = currentTotalBpi - radarBpi;
        if (weakness > 10) {
          score -= 0.15 * (weakness / 10);
        }
      }

      scored.push({ song: c, score, estimatedTargetBpi });
    }

    if (scored.length === 0) break;

    scored.sort((a, b) => b.score - a.score);

    const poolSize = isFastest ? 5 : 20;
    const topPool = scored.slice(0, Math.min(scored.length, poolSize));
    const pickIndex =
      topPool.length > 1
        ? isFastest
          ? Math.floor(Math.pow(Math.random(), 2) * topPool.length)
          : Math.floor(Math.random() * topPool.length)
        : 0;

    const { song: pickedSong } = topPool[pickIndex];
    const fromBpi = pickedSong.currentBpi;
    const radarBpi =
      pickedSong.radarCategory != null
        ? (options.radarCategoryBpis[pickedSong.radarCategory] ?? null)
        : null;
    const capBase = considerCurrentTotalBpi
      ? currentTotalBpi
      : targetTotalValue;
    const userCapability = Math.max(capBase, radarBpi ?? capBase);
    const humanCapBase2 = considerCurrentTotalBpi
      ? Math.min(
          100,
          radarBpi !== null
            ? Math.min(radarBpi + 3.0, currentTotalBpi + 12.0)
            : currentTotalBpi + 12.0,
        )
      : 100;
    const humanCap = Math.min(100, Math.max(humanCapBase2, fromBpi + 5.0));
    const isEffectivelyUnplayed = pickedSong.isUnplayed || fromBpi <= -15;

    let theoreticalNextBpi: number;

    if (isFastest) {
      const growthPotential =
        fromBpi < 0 ? 15.0 : Math.max(3.0, 10.0 - fromBpi / 20);
      const requiredBpi = calculateBpiFromContribution(
        calculateContribution(fromBpi, exponent, n) + remainingSumGap,
        exponent,
        n,
      );
      theoreticalNextBpi = Math.min(
        requiredBpi,
        humanCap,
        fromBpi + growthPotential,
      );
      theoreticalNextBpi = Math.max(theoreticalNextBpi, fromBpi + MIN_BPI_GAIN);
    } else {
      if (isEffectivelyUnplayed) {
        const modeBonus = Math.random() * 2.0;
        theoreticalNextBpi = Math.min(userCapability + modeBonus, humanCap);
        theoreticalNextBpi = Math.max(
          theoreticalNextBpi,
          fromBpi + MIN_BPI_GAIN,
        );
      } else {
        // Played: distribute evenly with buffer
        const targetStepSum =
          remainingSumGap / (remainingSteps * FLEXIBLE_BUFFER);
        const idealNextBpi = calculateBpiFromContribution(
          calculateContribution(fromBpi, exponent, n) + targetStepSum,
          exponent,
          n,
        );
        const gapWithCap = userCapability - fromBpi;
        const flexibleLimit = gapWithCap > 15 ? 8.0 : 3.0;
        theoreticalNextBpi = Math.min(
          idealNextBpi,
          fromBpi + flexibleLimit + Math.random(),
          humanCap,
        );
        theoreticalNextBpi = Math.max(
          theoreticalNextBpi,
          fromBpi + MIN_BPI_GAIN,
        );
      }

      if (
        steps.length === maxStepsInput - 1 ||
        remainingPool.filter((c) => !usedIds.has(c.songId)).length === 1
      ) {
        const closingBpi = calculateBpiFromContribution(
          calculateContribution(fromBpi, exponent, n) + remainingSumGap,
          exponent,
          n,
        );
        if (closingBpi <= humanCap && closingBpi > fromBpi + MIN_BPI_GAIN) {
          theoreticalNextBpi = closingBpi;
        }
      }
    }

    theoreticalNextBpi = Math.min(100, theoreticalNextBpi);

    const currentEx = pickedSong.currentExScore ?? 0;
    const rawToExFloat =
      BpiCalculator.calcFromBPI(theoreticalNextBpi, {
        notes: pickedSong.notes,
        kaidenAvg: pickedSong.kaidenAvg,
        wrScore: pickedSong.wrScore,
        coef: pickedSong.coef,
      }) + carryError;

    let toExScore = Math.round(rawToExFloat);
    carryError = rawToExFloat - toExScore;

    if (toExScore < currentEx + MIN_EX_GAIN) {
      toExScore = currentEx + MIN_EX_GAIN;
      carryError = 0;
    }

    const maxScore = pickedSong.notes * 2;
    if (toExScore > maxScore) {
      toExScore = maxScore;
      carryError = 0;
    }

    const exGain = toExScore - currentEx;

    const actualNextBpiRaw = BpiCalculator.calc(toExScore, {
      notes: pickedSong.notes,
      kaidenAvg: pickedSong.kaidenAvg,
      wrScore: pickedSong.wrScore,
      coef: pickedSong.coef,
    });
    const actualNextBpi = actualNextBpiRaw ?? fromBpi;

    const actualBpiGain = actualNextBpi - fromBpi;
    if (exGain < MIN_EX_GAIN && actualBpiGain < MIN_BPI_GAIN) {
      usedIds.add(pickedSong.songId);
      continue;
    }

    const prevContrib = calculateContribution(fromBpi, exponent, n);
    const nextContrib = calculateContribution(actualNextBpi, exponent, n);
    currentAccumulatedSum += nextContrib - prevContrib;
    const nextTotalBpi = calculateTotalFromSum(currentAccumulatedSum, exponent);

    steps.push({
      rank: steps.length + 1,
      songId: pickedSong.songId,
      title: pickedSong.title,
      difficulty: pickedSong.difficulty,
      difficultyLevel: pickedSong.difficultyLevel,
      fromBpi,
      toBpi: Math.round(actualNextBpi * 100) / 100,
      fromExScore: pickedSong.currentExScore,
      toExScore,
      exScoreGap: exGain,
      bpiGain: Math.round((nextTotalBpi - currentTotalBpi) * 100) / 100,
      cumulativeTotalBpi: Math.round(nextTotalBpi * 100) / 100,
      isUnplayed: fromBpi <= -15,
      radarCategory: pickedSong.radarCategory,
      isRadarStrength: !!(
        pickedSong.radarCategory &&
        strongCategories.has(pickedSong.radarCategory)
      ),
    });

    currentTotalBpi = nextTotalBpi;
    usedIds.add(pickedSong.songId);
  }

  const isAchievable = currentTotalBpi >= effectiveTargetValue - 0.05;
  const maxAchievableBpi =
    steps.length > 0
      ? steps[steps.length - 1].cumulativeTotalBpi
      : Math.round(initialTotal * 100) / 100;

  if (steps.length > 0 && isAchievable) {
    steps[steps.length - 1].cumulativeTotalBpi =
      Math.round(effectiveTargetValue * 100) / 100;
  }

  return {
    steps,
    currentTotalBpi: Math.round(initialTotal * 100) / 100,
    targetTotalBpi: effectiveTargetValue,
    originalTargetTotalBpi,
    achievable: isAchievable,
    alreadyAchieved: false,
    totalSongCount: n,
    autoAdjustmentNote,
    maxAchievableBpi: !isAchievable ? maxAchievableBpi : undefined,
  };
}

export function findOptimalBpiPath(
  sourceData: SongOptimizerInput[],
  totalCount: number,
  targetTotalValue: number,
  options: OptimizerOptions & {
    searchMode?: "fastest" | "flexible";
    maxRetries?: number;
  },
  maxStepsInput = 30,
): OptimizationResult {
  const maxRetries = options.maxRetries ?? 10;

  let bestResult: OptimizationResult | null = null;

  for (let i = 0; i < maxRetries; i++) {
    const result = executeOptimization(
      sourceData,
      totalCount,
      targetTotalValue,
      options,
      maxStepsInput,
    );

    if (result.alreadyAchieved || result.achievable) {
      return result;
    }

    const currentMaxBpi = result.maxAchievableBpi ?? result.currentTotalBpi;

    const bestMaxBpi = bestResult
      ? (bestResult.maxAchievableBpi ?? bestResult.currentTotalBpi)
      : -Infinity;

    if (!bestResult || currentMaxBpi > bestMaxBpi) {
      bestResult = result;
    }
  }

  return bestResult as OptimizationResult;
}
