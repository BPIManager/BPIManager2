import { SongWithScore } from "@/types/songs/withScore";
import { sortSongs } from "@/utils/songs/sort";
import { describe, it, expect } from "vitest";

const mockSongs: SongWithScore[] = [
  {
    songId: 1,
    title: "Friction",
    difficultyLevel: 12,
    notes: 1000,
    exScore: 800,
    exDiff: 100,
    bpi: 30,
    bpiDiff: 10,
    releasedVersion: 27,
    bpm: "150",
    scoreAt: "2024-01-01T00:00:00Z",
    clearState: "CLEAR",
    missCount: 10,
    rival: {
      exScore: 700,
      bpi: 20,
      lastPlayed: "2024-01-10T00:00:00Z",
      clearState: "CLEAR",
      missCount: 20,
    },
    difficulty: "ANOTHER",
    kaidenAvg: 700,
    wrScore: 900,
    coef: 1.175,
    logId: 101,
  },
  {
    songId: 2,
    title: "Beat",
    difficultyLevel: 12,
    notes: 1000,
    exScore: 600,
    exDiff: -300,
    bpi: 10,
    bpiDiff: -40,
    releasedVersion: 30,
    bpm: "160",
    scoreAt: "2024-01-05T00:00:00Z",
    clearState: "EASY CLEAR",
    missCount: 30,
    rival: {
      exScore: 900,
      bpi: 50,
      lastPlayed: "2024-01-02T00:00:00Z",
      clearState: "HARD CLEAR",
      missCount: 5,
    },
    difficulty: "ANOTHER",
    kaidenAvg: 700,
    wrScore: 900,
    coef: 1.175,
    logId: 102,
  },
  {
    songId: 3,
    title: "Absolute",
    difficultyLevel: 11,
    notes: 1000,
    exScore: 900,
    exDiff: 50,
    bpi: 80,
    bpiDiff: 5,
    releasedVersion: 20,
    bpm: "140",
    scoreAt: "2024-01-03T00:00:00Z",
    clearState: "FULL COMBO",
    missCount: 0,
    rival: {
      exScore: 850,
      bpi: 75,
      lastPlayed: "2024-01-03T00:00:00Z",
      clearState: "FULL COMBO",
      missCount: 0,
    },
    difficulty: "ANOTHER",
    kaidenAvg: 700,
    wrScore: 950,
    coef: 1.175,
    logId: 103,
  },
];

describe("sortSongs - Comprehensive Test", () => {
  it("level: レベル降順でソートされること", () => {
    const res = sortSongs(mockSongs, { sortKey: "level", sortOrder: "desc" });
    expect(res[0].difficultyLevel).toBe(12);
    expect(res[2].difficultyLevel).toBe(11);
  });

  it("title: タイトル昇順でソートされること", () => {
    const res = sortSongs(mockSongs, { sortKey: "title", sortOrder: "asc" });
    expect(res[0].title).toBe("Absolute");
    expect(res[2].title).toBe("Friction");
  });

  it("notes: ノーツ数降順でソートされること", () => {
    const res = sortSongs(mockSongs, { sortKey: "notes", sortOrder: "desc" });
    expect(res[0].difficultyLevel).toBe(12);
  });

  it("bpm: 最大BPM降順でソートされること", () => {
    const res = sortSongs(mockSongs, { sortKey: "bpm", sortOrder: "desc" });
    expect(res[0].bpm).toBe("160");
  });

  it("version: 登場バージョン降順でソートされること", () => {
    const res = sortSongs(mockSongs, { sortKey: "version", sortOrder: "desc" });
    expect(res[0].releasedVersion).toBe(30);
  });

  // --- スコア / BPI ---
  it("myBpi: 自分のBPI降順でソートされること", () => {
    const res = sortSongs(mockSongs, { sortKey: "myBpi", sortOrder: "desc" });
    expect(res[0].songId).toBe(3);
  });

  it("rivalBpi: ライバルのBPI降順でソートされること", () => {
    const res = sortSongs(mockSongs, {
      sortKey: "rivalBpi",
      sortOrder: "desc",
    });
    expect(res[0].songId).toBe(3);
  });

  it("myRate: 自分のスコアレート降順でソートされること", () => {
    const res = sortSongs(mockSongs, { sortKey: "myRate", sortOrder: "desc" });
    expect(res[0].songId).toBe(3);
  });

  // --- 比較 (Gap) 系 ---
  it("winGapAsc: 自分勝ちの中で、EX差が小さい順（接戦）が上に来ること", () => {
    const res = sortSongs(mockSongs, { sortKey: "winGapAsc" });
    expect(res[0].songId).toBe(3);
    expect(res[1].songId).toBe(1);
    expect(res[2].songId).toBe(2);
  });

  it("loseGapDesc: ライバル勝ちの中で、EX差が大きい順（完敗）が上に来ること", () => {
    const res = sortSongs(mockSongs, { sortKey: "loseGapDesc" });
    expect(res[0].songId).toBe(2);
  });

  it("winBpiGapDesc: 自分勝ちの中で、BPIの差が大きい順（格下撃破）が上に来ること", () => {
    const res = sortSongs(mockSongs, { sortKey: "winBpiGapDesc" });
    expect(res[0].songId).toBe(1);
    expect(res[1].songId).toBe(3);
  });

  // --- 更新日時 ---
  it("myUpdated: 自分の更新が新しい順にソートされること", () => {
    const res = sortSongs(mockSongs, {
      sortKey: "myUpdated",
      sortOrder: "desc",
    });
    expect(res[0].songId).toBe(2); // 01-05
    expect(res[2].songId).toBe(1); // 01-01
  });

  it("rivalUpdated: ライバルの更新が新しい順にソートされること", () => {
    const res = sortSongs(mockSongs, {
      sortKey: "rivalUpdated",
      sortOrder: "desc",
    });
    expect(res[0].songId).toBe(1); // 01-10
  });

  // --- 検索ロジック ---
  it("search: 検索語句への完全一致が最優先されること", () => {
    const res = sortSongs(mockSongs, { search: "Friction", sortKey: "level" });
    expect(res[0].title).toBe("Friction");
  });

  it("search: 前方一致が次に優先されること", () => {
    const res = sortSongs(mockSongs, { search: "Ab", sortKey: "level" });
    expect(res[0].title).toBe("Absolute");
  });

  // --- 特殊ケース ---
  it("rivalデータが不在でもクラッシュせず、一番下に配置されること", () => {
    const noRivalData: any = {
      songId: 9,
      title: "None",
      notes: 1000,
      rival: null,
      difficultyLevel: 12,
      difficulty: "ANOTHER",
      clearState: "NO PLAY",
      missCount: null,
      exScore: null,
      bpi: null,
      scoreAt: null,
    };
    const combined = [...mockSongs, noRivalData];
    const res = sortSongs(combined, { sortKey: "rivalBpi", sortOrder: "desc" });
    expect(res[res.length - 1].songId).toBe(9);
  });
});
