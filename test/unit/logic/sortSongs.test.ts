import { SongWithScore } from "@/types/songs/score";
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

  // --- 比較 (Gap) 系: 自分−ライバルの符号付き差を昇順/降順で並べる ---
  it("exGap desc: 自分が大きく勝っている順に並ぶこと", () => {
    const res = sortSongs(mockSongs, { sortKey: "exGap", sortOrder: "desc" });
    expect(res.map((s) => s.songId)).toEqual([1, 3, 2]);
  });

  it("exGap asc: ライバルが大きく勝っている順に並ぶこと", () => {
    const res = sortSongs(mockSongs, { sortKey: "exGap", sortOrder: "asc" });
    expect(res.map((s) => s.songId)).toEqual([2, 3, 1]);
  });

  it("bpiGap desc: BPI差が大きい順に並ぶこと", () => {
    const res = sortSongs(mockSongs, { sortKey: "bpiGap", sortOrder: "desc" });
    expect(res.map((s) => s.songId)).toEqual([1, 3, 2]);
  });

  // --- 複数ターゲット: `<key>#<index>` で2件目以降のターゲットを基準にする ---
  it("rivalBpi#1: 2件目のターゲットのBPI降順で並ぶこと", () => {
    const withTargets = mockSongs.map((s, i) => ({
      ...s,
      targets: [
        { rival: s.rival ?? null, exDiff: s.exDiff, bpiDiff: s.bpiDiff },
        {
          rival: { ...s.rival!, bpi: [5, 70, 40][i] },
          exDiff: [0, 0, 0][i],
          bpiDiff: [0, 0, 0][i],
        },
      ],
    }));
    const res = sortSongs(withTargets, { sortKey: "rivalBpi#1", sortOrder: "desc" });
    expect(res.map((s) => s.songId)).toEqual([2, 3, 1]);
  });

  it("exGap#1: 2件目のターゲットとのEX差で並ぶこと", () => {
    const withTargets = mockSongs.map((s, i) => ({
      ...s,
      targets: [
        { rival: s.rival ?? null, exDiff: s.exDiff, bpiDiff: s.bpiDiff },
        { rival: s.rival ?? null, exDiff: [-5, 200, 10][i] },
      ],
    }));
    const res = sortSongs(withTargets, { sortKey: "exGap#1", sortOrder: "desc" });
    expect(res.map((s) => s.songId)).toEqual([2, 3, 1]);
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
    const noRivalData: SongWithScore = {
      songId: 9,
      title: "None",
      notes: 1000,
      bpm: null,
      rival: null,
      difficultyLevel: 12,
      difficulty: "ANOTHER",
      releasedVersion: null,
      logId: null,
      clearState: "NO PLAY",
      missCount: null,
      exScore: null,
      bpi: null,
      scoreAt: null,
      wrScore: null,
      kaidenAvg: null,
      coef: null,
    };
    const combined = [...mockSongs, noRivalData];
    const res = sortSongs(combined, { sortKey: "rivalBpi", sortOrder: "desc" });
    expect(res[res.length - 1].songId).toBe(9);
  });
});
