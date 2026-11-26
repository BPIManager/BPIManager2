import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/domains/allSongs", () => ({ allSongsRepo: { getPublicMaster: vi.fn() } }));

import { buildAllSongsMaster } from "@/lib/subhandlers/songs/allSongsMaster";

const rows = [
  { songId: 1, title: "HEARTACHE", notes: 930, difficulty: "ANOTHER", difficultyLevel: 10 },
  { songId: 2, title: "A", notes: 100, difficulty: "NORMAL", difficultyLevel: 3 },
];

describe("buildAllSongsMaster", () => {
  it("☆11/12 以外も含めて配信形式に整形する", () => {
    const { songs } = buildAllSongsMaster(rows);
    expect(songs[0]).toEqual({
      songId: 1,
      title: "HEARTACHE",
      playStyle: "SP",
      difficulty: "ANOTHER",
      level: 10,
      notes: 930,
    });
    expect(songs.map((s) => s.level)).toEqual([10, 3]);
  });

  it("内容が同じなら version は同じ、変われば変わる", () => {
    const a = buildAllSongsMaster(rows).version;
    expect(buildAllSongsMaster([...rows]).version).toBe(a);
    expect(buildAllSongsMaster([{ ...rows[0], notes: 931 }, rows[1]]).version).not.toBe(a);
  });
});
