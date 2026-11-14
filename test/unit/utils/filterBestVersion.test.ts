import { describe, it, expect } from "vitest";
import { filterSongsFrontend } from "@/utils/songs/filter";
import type { SongWithRival } from "@/types/songs/score";

const song = (songId: number, version: string | null | undefined) =>
  ({
    songId,
    title: `s${songId}`,
    difficulty: "ANOTHER",
    difficultyLevel: 12,
    bpm: "150",
    releasedVersion: 30,
    exScore: 1000,
    clearState: null,
    rival: { exScore: 1100, bpi: 0, clearState: null, missCount: null, lastPlayed: null, version },
  }) as unknown as SongWithRival;

describe("filterSongsFrontend bestVersion", () => {
  const data = [song(1, "33"), song(2, "34"), song(3, null), song(4, undefined)];

  it("自己歴代を出したバージョンが一致する譜面だけに絞る", () => {
    const result = filterSongsFrontend(data, { bestVersion: "33" });
    expect(result.map((s) => s.songId)).toEqual([1]);
  });

  it("未指定なら絞り込まない", () => {
    expect(filterSongsFrontend(data, {})).toHaveLength(4);
  });
});
