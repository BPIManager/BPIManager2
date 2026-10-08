import { describe, expect, it } from "vitest";
import { mergeTargetSongs } from "@/hooks/analytics/mergeTargets";
import type { SongWithRival } from "@/types/songs/score";

function song(
  songId: number,
  rivalEx: number | null,
  exDiff?: number,
  overrides: Partial<SongWithRival> = {},
): SongWithRival {
  return {
    songId,
    title: `S${songId}`,
    bpm: "150",
    difficulty: "ANOTHER",
    difficultyLevel: 12,
    releasedVersion: 33,
    notes: 1000,
    kaidenAvg: 1700,
    wrScore: 1950,
    coef: 1.1,
    logId: songId,
    exScore: 1800,
    bpi: 50,
    clearState: null,
    missCount: null,
    scoreAt: null,
    rival: {
      exScore: rivalEx,
      bpi: rivalEx === null ? null : 40,
      clearState: null,
      missCount: null,
      lastPlayed: null,
    },
    exDiff,
    bpiDiff: undefined,
    ...overrides,
  };
}

describe("mergeTargetSongs", () => {
  it("先頭ターゲットは rival/exDiff に、全ターゲットは targets に並ぶ", () => {
    const merged = mergeTargetSongs([
      [song(1, 1700, 100), song(2, 1600, 200)],
      [song(1, 1900, -100), song(2, null)],
    ]);

    expect(merged).toHaveLength(2);
    expect(merged[0].rival.exScore).toBe(1700);
    expect(merged[0].exDiff).toBe(100);
    expect(merged[0].targets?.map((t) => t.rival?.exScore)).toEqual([1700, 1900]);
    expect(merged[0].targets?.map((t) => t.exDiff)).toEqual([100, -100]);
    expect(merged[1].targets?.map((t) => t.rival?.exScore)).toEqual([1600, null]);
  });

  it("2件目にしか無い譜面も行として残り、先頭ターゲット分は空になる", () => {
    const merged = mergeTargetSongs([[song(1, 1700, 100)], [song(1, 1900, -100), song(3, 1500, 300)]]);

    expect(merged.map((m) => m.songId)).toEqual([1, 3]);
    const only2nd = merged[1];
    expect(only2nd.rival.exScore).toBeNull();
    expect(only2nd.exDiff).toBeUndefined();
    expect(only2nd.targets?.[0].rival).toBeNull();
    expect(only2nd.targets?.[1].rival?.exScore).toBe(1500);
  });

  it("未取得(undefined)のターゲットがあっても行を落とさない", () => {
    const merged = mergeTargetSongs([[song(1, 1700, 100)], undefined]);
    expect(merged).toHaveLength(1);
    expect(merged[0].targets).toHaveLength(2);
    expect(merged[0].targets?.[1].rival).toBeNull();
  });
});
