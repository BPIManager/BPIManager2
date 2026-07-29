import { describe, it, expect } from "vitest";
import {
  getBpiDistribution,
  getRankDistribution,
} from "@/utils/logs/getDistribution";
import { mapToFlatSong } from "@/utils/logs/getMapFlatten";
import { mapToLogNested } from "@/utils/logs/getMapNested";
import { mapBatchToSongs } from "@/utils/logs/getSongTable";
import type { BatchDetailItem } from "@/types/logs/batchDetail";

const baseItem: BatchDetailItem = {
  songId: 1,
  title: "冥",
  notes: 1000,
  difficulty: "ANOTHER",
  difficultyLevel: 12,
  level: 12,
  bpm: "200",
  releasedVersion: 27,
  wrScore: 1900,
  kaidenAvg: 1500,
  coef: 1.175,
  current: {
    exScore: 1000,
    bpi: 20,
    clearState: "HARD CLEAR",
    missCount: 10,
    lastPlayedAt: "2025-01-01T00:00:00Z",
  },
  previous: null,
  diff: { exScore: 0, bpi: 0 },
  overtaken: [],
};

describe("getBpiDistribution", () => {
  it("BPI値を対応するバケットに振り分けること", () => {
    const details = [
      { ...baseItem, current: { ...baseItem.current, bpi: -20 } },
      { ...baseItem, current: { ...baseItem.current, bpi: 0 } },
      { ...baseItem, current: { ...baseItem.current, bpi: 150 } },
    ];
    const buckets = getBpiDistribution(details, 10);

    expect(buckets[0]).toEqual({ label: "<-10", count: 1 });
    expect(buckets[buckets.length - 1]).toEqual({ label: "100+", count: 1 });
    const zeroBucket = buckets.find((b) => b.label === "0");
    expect(zeroBucket?.count).toBe(1);
  });

  it("bpiがnullの項目は-15扱いで<-10バケットに入ること", () => {
    const details = [
      { ...baseItem, current: { ...baseItem.current, bpi: null as unknown as number } },
    ];
    const buckets = getBpiDistribution(details);
    expect(buckets[0].count).toBe(1);
  });
});

describe("getRankDistribution", () => {
  it("notesが0の項目はカウントされないこと", () => {
    const details = [{ ...baseItem, notes: 0 }];
    const buckets = getRankDistribution(details);
    expect(buckets.every((b) => b.count === 0)).toBe(true);
  });

  it("達成率に応じたランクにカウントされること", () => {
    const details = [
      {
        ...baseItem,
        notes: 1000,
        current: { ...baseItem.current, exScore: 2000 },
      },
    ];
    const buckets = getRankDistribution(details);
    const maxBucket = buckets.find((b) => b.label === "MAX-");
    expect(maxBucket?.count).toBe(1);
  });
});

describe("mapToFlatSong", () => {
  it("生の行データをSongWithScore形式に変換すること", () => {
    const result = mapToFlatSong({
      songId: 1,
      title: "未知の曲名タイトル",
      notes: "1000",
      bpm: "200",
      difficulty: "ANOTHER",
      difficultyLevel: 12,
      releasedVersion: 27,
      logId: "5",
      exScore: "1800",
      bpi: 30,
      clearState: "HARD CLEAR",
      missCount: 5,
      scoreAt: "2025-01-01T00:00:00Z",
      wrScore: 1900,
      kaidenAvg: 1500,
      coef: 1.175,
    });

    expect(result.notes).toBe(1000);
    expect(result.logId).toBe(5);
    expect(result.exScore).toBe(1800);
    expect(result.radarTop).toBeNull();
  });

  it("logId/exScoreがnullのとき変換後もnullを維持すること", () => {
    const result = mapToFlatSong({
      songId: 1,
      title: "曲",
      notes: null,
      bpm: null,
      difficulty: "ANOTHER",
      difficultyLevel: 12,
      releasedVersion: null,
      logId: null,
      exScore: null,
      bpi: null,
      clearState: null,
      missCount: null,
      scoreAt: null,
      wrScore: null,
      kaidenAvg: null,
      coef: null,
    });

    expect(result.notes).toBe(0);
    expect(result.logId).toBeNull();
    expect(result.exScore).toBeNull();
  });
});

describe("mapToLogNested", () => {
  it("previousがある場合、diffを現在値と過去値の差で計算すること", () => {
    const result = mapToLogNested({
      songId: 1,
      title: "冥",
      difficulty: "ANOTHER",
      difficultyLevel: 12,
      notes: 1000,
      bpm: "200",
      releasedVersion: 27,
      exScore: "1800",
      bpi: 30,
      clearState: "HARD CLEAR",
      missCount: 5,
      scoreAt: "2025-01-02T00:00:00Z",
      p_exScore: "1700",
      p_bpi: 25,
      p_clearState: "CLEAR",
      p_missCount: 10,
      wrScore: 1900,
      kaidenAvg: 1500,
      coef: 1.175,
    });

    expect(result.diff.exScore).toBe(100);
    expect(result.diff.bpi).toBe(5);
    expect(result.previous).toEqual({
      exScore: 1700,
      bpi: 25,
      clearState: "CLEAR",
      missCount: 10,
    });
  });

  it("previousがない場合、diff.exScoreはcurrentExそのもの、diff.bpiはbpi+15基準になること", () => {
    const result = mapToLogNested({
      songId: 1,
      title: "冥",
      difficulty: "ANOTHER",
      difficultyLevel: 12,
      notes: 1000,
      bpm: "200",
      releasedVersion: 27,
      exScore: "1800",
      bpi: 30,
      clearState: "HARD CLEAR",
      missCount: 5,
      scoreAt: "2025-01-02T00:00:00Z",
      p_exScore: null,
      p_bpi: null,
      p_clearState: null,
      p_missCount: null,
      wrScore: 1900,
      kaidenAvg: 1500,
      coef: 1.175,
    });

    expect(result.previous).toBeNull();
    expect(result.diff.exScore).toBe(1800);
    expect(result.diff.bpi).toBe(45);
  });
});

describe("mapBatchToSongs", () => {
  it("BatchDetailItemの各フィールドを展開しdjRankDisplayを付与すること", () => {
    const [result] = mapBatchToSongs([baseItem]);

    expect(result.exScore).toBe(1000);
    expect(result.bpi).toBe(20);
    expect(result.clearState).toBe("HARD CLEAR");
    expect(result.difficultyLevel).toBe(12);
    expect(result.djRankDisplay.current).toMatch(/^[A-Z+\-]+\d+$/);
    expect(result.djRankDisplay.next).toMatch(/^[A-Z+\-]+\d+$/);
  });
});
