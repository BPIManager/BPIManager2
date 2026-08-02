import { describe, it, expect } from "vitest";
import { mergeFixedTarget, toBpiParams } from "@/hooks/analytics/comparisonRows";
import type { SongWithScore } from "@/types/songs/score";

function buildSong(overrides: Partial<SongWithScore> = {}): SongWithScore {
  return {
    songId: 1,
    title: "冥",
    notes: 1000,
    bpm: "200",
    difficulty: "ANOTHER",
    difficultyLevel: 12,
    releasedVersion: 27,
    logId: 1,
    exScore: 1800,
    bpi: 10,
    clearState: "HARD CLEAR",
    missCount: 3,
    scoreAt: null,
    wrScore: 1900,
    kaidenAvg: 1500,
    coef: 1.175,
    ...overrides,
  };
}

describe("toBpiParams", () => {
  it("BPI計算に必要な4項目のみを抽出すること", () => {
    const song = buildSong();

    expect(toBpiParams(song)).toEqual({
      notes: 1000,
      kaidenAvg: 1500,
      wrScore: 1900,
      coef: 1.175,
    });
  });
});

describe("mergeFixedTarget", () => {
  it("exDiff/bpiDiffを正しく計算しrivalとしてマージすること", () => {
    const song = buildSong({ exScore: 1800, bpi: 10 });

    const result = mergeFixedTarget(song, 1700, 8);

    expect(result.exDiff).toBe(100);
    expect(result.bpiDiff).toBe(2);
    expect(result.rival).toEqual({
      exScore: 1700,
      bpi: 8,
      clearState: null,
      missCount: null,
      lastPlayed: null,
    });
  });

  it("targetEx/targetBpiがnullの場合はexDiff/bpiDiffがundefinedになること", () => {
    const song = buildSong({ exScore: 1800, bpi: 10 });

    const result = mergeFixedTarget(song, null, null);

    expect(result.exDiff).toBeUndefined();
    expect(result.bpiDiff).toBeUndefined();
    expect(result.rival.exScore).toBeNull();
    expect(result.rival.bpi).toBeNull();
  });

  it("自分のexScore/bpiがnullの場合もexDiff/bpiDiffがundefinedになること", () => {
    const song = buildSong({ exScore: null, bpi: null });

    const result = mergeFixedTarget(song, 1700, 8);

    expect(result.exDiff).toBeUndefined();
    expect(result.bpiDiff).toBeUndefined();
  });

  it("bpiDiffが小数第2位に丸められること", () => {
    const song = buildSong({ bpi: 10.126 });

    const result = mergeFixedTarget(song, null, 10.001);

    expect(result.bpiDiff).toBe(0.13);
  });
});
