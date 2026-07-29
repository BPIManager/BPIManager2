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
});
