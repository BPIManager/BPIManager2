import { sortSongs } from "@/utils/songs/sort";
import { describe, it, expect, vi } from "vitest";

// テスト用データセット
const mockSongs: any[] = [
  {
    songId: 1,
    title: "Friction",
    difficultyLevel: 12,
    notes: 1000,
    exScore: 800, // 80%
    bpi: 30,
    releasedVersion: 27,
    bpm: "150",
    scoreAt: "2024-01-01T00:00:00Z",
    rival: { exScore: 700, bpi: 20, lastPlayed: "2024-01-10T00:00:00Z" }, // 勝ち
  },
  {
    songId: 2,
    title: "Beat",
    difficultyLevel: 12,
    notes: 1000,
    exScore: 600, // 60%
    bpi: 10,
    releasedVersion: 30,
    bpm: "160",
    scoreAt: "2024-01-05T00:00:00Z",
    rival: { exScore: 900, bpi: 50, lastPlayed: "2024-01-02T00:00:00Z" }, // 負け
  },
  {
    songId: 3,
    title: "Absolute",
    difficultyLevel: 11,
    notes: 1000,
    exScore: 900, // 90%
    bpi: 80,
    releasedVersion: 20,
    bpm: "140",
    scoreAt: "2024-01-03T00:00:00Z",
    rival: { exScore: 850, bpi: 75, lastPlayed: "2024-01-03T00:00:00Z" }, // 勝ち（僅差）
  },
];

describe("sortSongs - Comprehensive Test", () => {
  // --- 基本情報 ---
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
    // 今回は全部1000なので、第二ソートのレベル順になるか確認
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
    expect(res[0].songId).toBe(3); // BPI 80
  });

  it("rivalBpi: ライバルのBPI降順でソートされること", () => {
    const res = sortSongs(mockSongs, {
      sortKey: "rivalBpi",
      sortOrder: "desc",
    });
    expect(res[0].songId).toBe(3); // Rival BPI 75
  });

  it("myRate: 自分のスコアレート降順でソートされること", () => {
    const res = sortSongs(mockSongs, { sortKey: "myRate", sortOrder: "desc" });
    expect(res[0].songId).toBe(3); // 90%
  });

  // --- 比較 (Gap) 系 ---
  it("winGapAsc: 自分勝ちの中で、EX差が小さい順（接戦）が上に来ること", () => {
    const res = sortSongs(mockSongs, { sortKey: "winGapAsc" });
    // 勝ち: ID 3 (5%差), ID 1 (10%差)
    // 負け: ID 2
    expect(res[0].songId).toBe(3);
    expect(res[1].songId).toBe(1);
    expect(res[2].songId).toBe(2);
  });

  it("loseGapDesc: ライバル勝ちの中で、EX差が大きい順（完敗）が上に来ること", () => {
    const res = sortSongs(mockSongs, { sortKey: "loseGapDesc" });
    // 負け: ID 2 (30%差) が最優先
    expect(res[0].songId).toBe(2);
  });

  it("winBpiGapDesc: 自分勝ちの中で、BPIの差が大きい順（格下撃破）が上に来ること", () => {
    const res = sortSongs(mockSongs, { sortKey: "winBpiGapDesc" });
    // ID 1: 30-20=10差で勝ち
    // ID 3: 80-75=5差で勝ち
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
    // 本来ID2がレベル等で上かもしれないが、完全一致のFrictionが1位になる
    expect(res[0].title).toBe("Friction");
  });

  it("search: 前方一致が次に優先されること", () => {
    const res = sortSongs(mockSongs, { search: "Ab", sortKey: "level" });
    expect(res[0].title).toBe("Absolute");
  });

  // --- 特殊ケース ---
  it("rivalデータが不在でもクラッシュせず、一番下に配置されること", () => {
    const noRivalData = [
      { songId: 9, title: "None", notes: 1000, rival: null },
    ];
    const combined = [...mockSongs, ...noRivalData];
    const res = sortSongs(combined, { sortKey: "rivalBpi", sortOrder: "desc" });
    expect(res[res.length - 1].songId).toBe(9);
  });
});
