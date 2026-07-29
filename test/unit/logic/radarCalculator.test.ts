import { describe, it, expect } from "vitest";
import { calculateRadar, ALL_CATEGORIES } from "@/lib/radar/calculator";
import topElements from "@/constants/iidx/radars/topElements";
import type { RadarCategory } from "@/types/stats/radar";

describe("calculateRadar", () => {
  it("スコアが空の場合、全カテゴリのtotalBpiが-15になること", () => {
    const result = calculateRadar([]);
    for (const category of ALL_CATEGORIES) {
      expect(result[category].totalBpi).toBe(-15);
    }
  });

  it("topElementsに存在しないタイトルのスコアはどのカテゴリにも分類されないこと", () => {
    const result = calculateRadar([
      {
        title: "存在しない架空の曲タイトルXYZ",
        difficulty: "ANOTHER",
        exScore: 1800,
        notes: 1000,
        bpi: 30,
      },
    ]);

    for (const category of ALL_CATEGORIES) {
      const played = result[category].songs.filter((s) => s.exScore !== null);
      expect(played).toHaveLength(0);
      expect(result[category].totalBpi).toBe(-15);
    }
  });

  it("topElementsに実在する楽曲のスコアは対応するカテゴリに分類されtotalBpiが計算されること", () => {
    const sample = topElements[0];
    const result = calculateRadar([
      {
        title: sample.title,
        difficulty: sample.difficulty,
        exScore: 1800,
        notes: 1000,
        bpi: 40,
      },
    ]);

    const category = result[sample.top as RadarCategory];
    const playedEntry = category.songs.find(
      (s) => s.title === sample.title && s.difficulty === sample.difficulty,
    );
    expect(playedEntry).toBeDefined();
    expect(playedEntry?.bpi).toBe(40);
    expect(category.totalBpi).not.toBe(-15);
  });

  it("bpiがnullのスコアは-15として扱われること", () => {
    const sample = topElements[0];
    const result = calculateRadar([
      {
        title: sample.title,
        difficulty: sample.difficulty,
        exScore: 1800,
        notes: 1000,
        bpi: null,
      },
    ]);
    const entry = result[sample.top as RadarCategory].songs.find(
      (s) => s.title === sample.title && s.difficulty === sample.difficulty,
    );
    expect(entry?.bpi).toBe(-15);
  });

  it("songsはbpi降順でソートされること", () => {
    const result = calculateRadar([]);
    for (const category of ALL_CATEGORIES) {
      const bpis = result[category].songs.map((s) => s.bpi);
      const sorted = [...bpis].sort((a, b) => b - a);
      expect(bpis).toEqual(sorted);
    }
  });

  it("validSongKeysを指定すると、未プレイ曲のうち含まれないものが除外されること", () => {
    const withoutFilter = calculateRadar([]);
    const withEmptyFilter = calculateRadar([], new Set());

    const category = ALL_CATEGORIES.find(
      (c) => withoutFilter[c].songs.length > 0,
    )!;
    expect(withEmptyFilter[category].songs).toHaveLength(0);
    expect(withoutFilter[category].songs.length).toBeGreaterThan(0);
  });
});
