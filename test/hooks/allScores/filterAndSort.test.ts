import { describe, it, expect } from "vitest";
import type { AllSongWithScore, AllScoreFilterParams } from "@/types/songs/allSongs";

// useAllSongsFilter 内部の filterLocal・sortLocal と同等のロジックを
// 単独でテストするためにここで再実装（型検証も兼ねる）

function filterLocal(
  songs: AllSongWithScore[],
  params: AllScoreFilterParams,
): AllSongWithScore[] {
  return songs.filter((s) => {
    if (
      params.search &&
      !s.title.toLowerCase().includes(params.search.toLowerCase())
    )
      return false;
    if (params.levels?.length && !params.levels.includes(s.difficultyLevel))
      return false;
    if (
      params.difficulties?.length &&
      !params.difficulties.includes(s.difficulty)
    )
      return false;
    if (
      params.clearStates?.length &&
      !params.clearStates.includes(s.clearState ?? "")
    )
      return false;
    return true;
  });
}

function sortLocal(
  songs: AllSongWithScore[],
  params: AllScoreFilterParams,
): AllSongWithScore[] {
  const order = params.sortOrder === "asc" ? 1 : -1;
  return [...songs].sort((a, b) => {
    switch (params.sortKey) {
      case "title":
        return a.title.localeCompare(b.title) * order;
      case "exScore":
        return ((a.exScore ?? -1) - (b.exScore ?? -1)) * order;
      case "updatedAt": {
        const at = a.lastPlayed ? new Date(a.lastPlayed).getTime() : 0;
        const bt = b.lastPlayed ? new Date(b.lastPlayed).getTime() : 0;
        return (at - bt) * order;
      }
      case "scoreRate": {
        const at = ((a.exScore ?? 0) / a.notes) * 2;
        const bt = ((b.exScore ?? 0) / b.notes) * 2;
        return (at - bt) * order;
      }
      case "level":
      default:
        return (
          (a.difficultyLevel - b.difficultyLevel) * order ||
          a.title.localeCompare(b.title)
        );
    }
  });
}

const makeSong = (
  id: number,
  title: string,
  level: number,
  difficulty: AllSongWithScore["difficulty"],
  exScore: number | null = null,
  clearState: string | null = null,
  lastPlayed: string | null = null,
): AllSongWithScore => ({
  songId: id,
  title,
  notes: 1000,
  bpm: "150",
  difficulty,
  difficultyLevel: level,
  releasedVersion: 32,
  logId: id,
  exScore,
  clearState,
  missCount: null,
  lastPlayed,
});

const songs: AllSongWithScore[] = [
  makeSong(1, "Absolute", 12, "ANOTHER", 900, "CLEAR", "2024-01-10T00:00:00Z"),
  makeSong(2, "Bounce", 11, "HYPER", 700, "EASY CLEAR", "2024-01-05T00:00:00Z"),
  makeSong(3, "Cascade", 12, "LEGGENDARIA", 500, "HARD CLEAR", "2024-01-01T00:00:00Z"),
  makeSong(4, "Delta", 10, "ANOTHER", null, null, null),
  makeSong(5, "Echo", 11, "ANOTHER", 800, "CLEAR", "2024-01-08T00:00:00Z"),
];

describe("filterLocal", () => {
  it("search でタイトルを絞り込む（大文字小文字無視）", () => {
    const result = filterLocal(songs, { search: "abs" });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Absolute");
  });

  it("levels で絞り込む", () => {
    const result = filterLocal(songs, { levels: [12] });
    expect(result.every((s) => s.difficultyLevel === 12)).toBe(true);
  });

  it("difficulties で絞り込む", () => {
    const result = filterLocal(songs, { difficulties: ["ANOTHER"] });
    expect(result.every((s) => s.difficulty === "ANOTHER")).toBe(true);
  });

  it("clearStates で絞り込む", () => {
    const result = filterLocal(songs, { clearStates: ["CLEAR"] });
    expect(result.every((s) => s.clearState === "CLEAR")).toBe(true);
  });

  it("複数条件の AND フィルター", () => {
    const result = filterLocal(songs, { levels: [11], difficulties: ["HYPER"] });
    expect(result).toHaveLength(1);
    expect(result[0].songId).toBe(2);
  });

  it("条件なしのとき全件返す", () => {
    expect(filterLocal(songs, {})).toHaveLength(songs.length);
  });
});

describe("sortLocal", () => {
  it("title 昇順でソートされる", () => {
    const result = sortLocal(songs, { sortKey: "title", sortOrder: "asc" });
    expect(result[0].title).toBe("Absolute");
    expect(result[result.length - 1].title).toBe("Echo");
  });

  it("title 降順でソートされる", () => {
    const result = sortLocal(songs, { sortKey: "title", sortOrder: "desc" });
    expect(result[0].title).toBe("Echo");
  });

  it("exScore 降順でソートされる（null は最下位）", () => {
    const result = sortLocal(songs, { sortKey: "exScore", sortOrder: "desc" });
    expect(result[0].exScore).toBe(900);
    // null (-1) は最小なので asc では先頭に来る
    const asc = sortLocal(songs, { sortKey: "exScore", sortOrder: "asc" });
    expect(asc[0].exScore).toBeNull();
  });

  it("level 降順でソートされる", () => {
    const result = sortLocal(songs, { sortKey: "level", sortOrder: "desc" });
    expect(result[0].difficultyLevel).toBeGreaterThanOrEqual(
      result[result.length - 1].difficultyLevel,
    );
  });

  it("updatedAt 降順でソートされる（lastPlayed = null は最下位）", () => {
    const result = sortLocal(songs, {
      sortKey: "updatedAt",
      sortOrder: "desc",
    });
    // 最新が先頭
    expect(result[0].lastPlayed).toBe("2024-01-10T00:00:00Z");
    // null は時刻 0 なので asc では先頭
    const asc = sortLocal(songs, { sortKey: "updatedAt", sortOrder: "asc" });
    expect(asc[0].lastPlayed).toBeNull();
  });

  it("scoreRate 降順でソートされる", () => {
    const result = sortLocal(songs, {
      sortKey: "scoreRate",
      sortOrder: "desc",
    });
    const rates = result.map((s) => ((s.exScore ?? 0) / s.notes) * 2);
    for (let i = 0; i < rates.length - 1; i++) {
      expect(rates[i]).toBeGreaterThanOrEqual(rates[i + 1]);
    }
  });

  it("元の配列を変更しない（イミュータブル）", () => {
    const original = [...songs];
    sortLocal(songs, { sortKey: "title", sortOrder: "asc" });
    expect(songs.map((s) => s.songId)).toEqual(original.map((s) => s.songId));
  });
});
