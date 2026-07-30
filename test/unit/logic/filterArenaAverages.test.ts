import { describe, it, expect } from "vitest";
import { filterArenaAverages } from "@/components/partials/features/Metrics/ArenaAverage/filterAverages";
import type { ArenaAverageData } from "@/types/metrics/arena";

const makeItem = (
  overrides: Partial<ArenaAverageData> = {},
): ArenaAverageData => ({
  title: "冥",
  difficulty: "ANOTHER",
  notes: 1000,
  maxScore: 2000,
  averages: {
    A1: { avgExScore: 1800, rate: 90, count: 10 },
  },
  ...overrides,
});

describe("filterArenaAverages", () => {
  it("selectedDifficultiesに含まれない難易度を除外すること", () => {
    const items = [
      makeItem({ difficulty: "ANOTHER" }),
      makeItem({ difficulty: "HYPER" }),
    ];
    const result = filterArenaAverages(items, {
      selectedDifficulties: new Set(["ANOTHER"]),
      nameSearch: "",
      detailFilters: [],
    });
    expect(result).toHaveLength(1);
    expect(result[0].difficulty).toBe("ANOTHER");
  });

  it("nameSearchで楽曲名を部分一致・大文字小文字区別なしで絞り込むこと", () => {
    const items = [makeItem({ title: "Sigmund" }), makeItem({ title: "冥" })];
    const result = filterArenaAverages(items, {
      selectedDifficulties: new Set(["ANOTHER"]),
      nameSearch: "sig",
      detailFilters: [],
    });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Sigmund");
  });

  it("scoreフィルタで閾値以上/以下を絞り込むこと", () => {
    const items = [
      makeItem({
        title: "high",
        averages: { A1: { avgExScore: 1900, rate: 95, count: 5 } },
      }),
      makeItem({
        title: "low",
        averages: { A1: { avgExScore: 1000, rate: 50, count: 5 } },
      }),
    ];
    const result = filterArenaAverages(items, {
      selectedDifficulties: new Set(["ANOTHER"]),
      nameSearch: "",
      detailFilters: [
        { id: "1", rank: "A1", metric: "score", operator: ">=", value: "1500" },
      ],
    });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("high");
  });

  it("該当ランクのデータが無い場合は除外すること", () => {
    const items = [makeItem({ averages: {} })];
    const result = filterArenaAverages(items, {
      selectedDifficulties: new Set(["ANOTHER"]),
      nameSearch: "",
      detailFilters: [
        { id: "1", rank: "A1", metric: "score", operator: ">=", value: "1500" },
      ],
    });
    expect(result).toHaveLength(0);
  });

  it("djrankフィルタでDJ RANK閾値以上を絞り込むこと", () => {
    const items = [
      makeItem({
        title: "aaa",
        averages: { A1: { avgExScore: 1900, rate: 90, count: 5 } },
      }),
      makeItem({
        title: "f",
        averages: { A1: { avgExScore: 100, rate: 5, count: 5 } },
      }),
    ];
    const result = filterArenaAverages(items, {
      selectedDifficulties: new Set(["ANOTHER"]),
      nameSearch: "",
      detailFilters: [
        { id: "1", rank: "A1", metric: "djrank", operator: ">=", value: "AAA" },
      ],
    });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("aaa");
  });
});
