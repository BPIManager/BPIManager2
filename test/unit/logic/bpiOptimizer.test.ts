import { describe, it, expect } from "vitest";
import { findOptimalBpiPath } from "@/lib/bpi/optimizer";
import type {
  OptimizerOptions,
  SongOptimizerInput,
} from "@/types/bpi-optimizer";

const baseSong: SongOptimizerInput = {
  songId: 1,
  title: "冥",
  difficulty: "ANOTHER",
  difficultyLevel: 12,
  notes: 1000,
  kaidenAvg: 1000,
  wrScore: 1900,
  coef: 1.175,
  currentBpi: -15,
  currentExScore: 0,
  isUnplayed: true,
  radarCategory: null,
};

const baseOptions: OptimizerOptions = {
  includeUnplayed: true,
  includePlayed: true,
  radarElementFilter: null,
  radarCategoryBpis: {},
  candidateLevels: [],
  candidateDifficulties: [],
};

describe("findOptimalBpiPath", () => {
  it("対象楽曲数が0の場合、達成不可・ステップなしの結果を返すこと", () => {
    const result = findOptimalBpiPath([], 0, 20, {
      ...baseOptions,
      searchMode: "fastest",
      rng: () => 0.5,
    });

    expect(result.totalSongCount).toBe(0);
    expect(result.steps).toEqual([]);
    expect(result.achievable).toBe(false);
    expect(result.alreadyAchieved).toBe(false);
  });

  it("既に現在の総合BPIが目標を上回っている場合、alreadyAchievedになりステップは生成されないこと", () => {
    const song: SongOptimizerInput = { ...baseSong, currentBpi: 30 };
    const result = findOptimalBpiPath([song], 1, 20, {
      ...baseOptions,
      searchMode: "fastest",
      rng: () => 0.5,
    });

    expect(result.alreadyAchieved).toBe(true);
    expect(result.achievable).toBe(true);
    expect(result.steps).toEqual([]);
    expect(result.currentTotalBpi).toBe(30);
  });

  it("到達可能な目標に対して、BPIが向上するステップを生成すること", () => {
    const song: SongOptimizerInput = { ...baseSong, currentBpi: -15 };
    const result = findOptimalBpiPath([song], 1, -5, {
      ...baseOptions,
      searchMode: "fastest",
      rng: () => 0.5,
    });

    expect(result.steps.length).toBeGreaterThan(0);
    const lastStep = result.steps[result.steps.length - 1];
    expect(lastStep.cumulativeTotalBpi).toBeGreaterThan(result.currentTotalBpi);
    expect(lastStep.toExScore).toBeGreaterThan(0);
    expect(lastStep.toExScore).toBeLessThanOrEqual(song.notes * 2);
  });

  it("includeUnplayedがfalseで候補が未プレイ曲のみの場合、候補なしとなり進展しないこと", () => {
    const song: SongOptimizerInput = { ...baseSong, isUnplayed: true };
    const result = findOptimalBpiPath(
      [song],
      1,
      20,
      {
        ...baseOptions,
        includeUnplayed: false,
        searchMode: "fastest",
        rng: () => 0.5,
      },
      5,
    );

    expect(result.steps).toEqual([]);
    expect(result.achievable).toBe(false);
    expect(result.alreadyAchieved).toBe(false);
  });

  it("candidateLevelsで対象レベルを絞り込めること", () => {
    const song: SongOptimizerInput = { ...baseSong, difficultyLevel: 12 };
    const result = findOptimalBpiPath(
      [song],
      1,
      20,
      {
        ...baseOptions,
        candidateLevels: [11],
        searchMode: "fastest",
        rng: () => 0.5,
      },
      5,
    );

    expect(result.steps).toEqual([]);
  });

  it("searchMode: flexibleでも到達可能な目標に対してBPIが向上するステップを生成すること", () => {
    const songs: SongOptimizerInput[] = [
      { ...baseSong, songId: 1, currentBpi: -15 },
      { ...baseSong, songId: 2, currentBpi: -15 },
      { ...baseSong, songId: 3, currentBpi: -15 },
    ];
    const result = findOptimalBpiPath(songs, 3, -5, {
      ...baseOptions,
      searchMode: "flexible",
      rng: () => 0.5,
    });

    expect(result.steps.length).toBeGreaterThan(0);
    const lastStep = result.steps[result.steps.length - 1];
    expect(lastStep.cumulativeTotalBpi).toBeGreaterThan(result.currentTotalBpi);
  });

  it("resolveTargetによる目標自動引き上げ: 目標までのギャップが小さくステップ数に対して割安な場合、targetTotalBpiが引き上げられoriginalTargetTotalBpi/autoAdjustmentNoteが設定されること", () => {
    const song: SongOptimizerInput = { ...baseSong, currentBpi: -15 };
    const requestedTarget = -14.9;
    const result = findOptimalBpiPath(
      [song],
      1,
      requestedTarget,
      {
        ...baseOptions,
        searchMode: "fastest",
        rng: () => 0.5,
      },
      30,
    );

    expect(result.originalTargetTotalBpi).toBe(requestedTarget);
    expect(result.targetTotalBpi).toBeGreaterThan(requestedTarget);
    expect(result.autoAdjustmentNote).toBeDefined();
  });

  it("resolveTargetが働かないケース: maxStepsが1以下の場合は目標自動引き上げをスキップしoriginalTargetTotalBpiが設定されないこと", () => {
    const song: SongOptimizerInput = { ...baseSong, currentBpi: -15 };
    const result = findOptimalBpiPath(
      [song],
      1,
      -5,
      {
        ...baseOptions,
        searchMode: "fastest",
        rng: () => 0.5,
      },
      1,
    );

    expect(result.originalTargetTotalBpi).toBeUndefined();
    expect(result.autoAdjustmentNote).toBeUndefined();
  });

  it("findOptimalPathのリトライ: 到達不可能な目標に対しても複数回試行し、最も到達点が高い結果を返すこと", () => {
    const song: SongOptimizerInput = { ...baseSong, currentBpi: -15 };
    // 1曲のみでは到達不可能な、非常に高い目標値
    const result = findOptimalBpiPath(
      [song],
      1,
      100,
      {
        ...baseOptions,
        searchMode: "fastest",
        rng: () => 0.5,
        maxRetries: 5,
      },
      5,
    );

    expect(result.alreadyAchieved).toBe(false);
    expect(result.achievable).toBe(false);
    expect(result.maxAchievableBpi).toBeDefined();
    expect(result.maxAchievableBpi!).toBeGreaterThan(result.currentTotalBpi);
  });

  it("opsBudgetRemainingの安全弁: 候補数×ステップ数×リトライ数が多い場合でも演算量の上限で打ち切られ、有限時間で結果を返すこと", () => {
    const manySongs: SongOptimizerInput[] = Array.from(
      { length: 500 },
      (_, i) => ({ ...baseSong, songId: i + 1, currentBpi: -15 }),
    );

    const result = findOptimalBpiPath(
      manySongs,
      500,
      100,
      {
        ...baseOptions,
        searchMode: "fastest",
        rng: () => 0.5,
        maxRetries: 200,
      },
      30,
    );

    expect(result).toBeDefined();
    expect(result.totalSongCount).toBe(500);
  });
});
