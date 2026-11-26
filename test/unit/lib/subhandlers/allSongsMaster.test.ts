import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/domains/allSongs", () => ({ allSongsRepo: { getPublicMaster: vi.fn() } }));

import { buildAllSongsMaster } from "@/lib/subhandlers/songs/allSongsMaster";

const rows = [
  { songId: 1, title: "HEARTACHE", artist: "Sota Fujimori", notes: 930, difficulty: "ANOTHER", difficultyLevel: 10 },
  { songId: 2, title: "A", artist: null, notes: 100, difficulty: "NORMAL", difficultyLevel: 3 },
];

describe("buildAllSongsMaster", () => {
  it("☆11/12 以外も含めて配信形式に整形する", () => {
    const { songs } = buildAllSongsMaster(rows);
    expect(songs[0]).toEqual({
      songId: 1,
      title: "HEARTACHE",
      artist: "Sota Fujimori",
      playStyle: "SP",
      difficulty: "ANOTHER",
      level: 10,
      notes: 930,
    });
    expect(songs.map((s) => s.level)).toEqual([10, 3]);
  });

  it("アーティスト名が未登録（null）の曲では、artist を含めない", () => {
    const { songs } = buildAllSongsMaster(rows);
    expect("artist" in songs[1]).toBe(false);
  });

  it("アーティスト名が変わると version も変わる（クライアントが再取得する）", () => {
    const a = buildAllSongsMaster(rows).version;
    expect(buildAllSongsMaster([{ ...rows[0], artist: "Other" }, rows[1]]).version).not.toBe(a);
    expect(buildAllSongsMaster([rows[0], { ...rows[1], artist: "New" }]).version).not.toBe(a);
  });

  it("内容が同じなら version は同じ、変われば変わる", () => {
    const a = buildAllSongsMaster(rows).version;
    expect(buildAllSongsMaster([...rows]).version).toBe(a);
    expect(buildAllSongsMaster([{ ...rows[0], notes: 931 }, rows[1]]).version).not.toBe(a);
  });
});
