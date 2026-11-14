import { describe, it, expect } from "vitest";
import { aggregateBestVersionCounts } from "@/lib/subhandlers/stats/_shared";

const row = (
  bestVersion: string | null,
  bestExScore: number | null = 100,
  difficultyLevel = 12,
  difficulty = "ANOTHER",
) => ({ bestVersion, bestExScore, difficultyLevel, difficulty });

describe("aggregateBestVersionCounts", () => {
  it("ベストを出したバージョンごとに新しい順で集計し、INFINITASは数値バージョンの後ろ、不明は末尾にまとめる", () => {
    const result = aggregateBestVersionCounts(
      [row("33"), row("34"), row("33"), row("INF"), row(null), row("")],
      { levels: [], difficulties: [] },
    );
    expect(result).toEqual([
      { label: "34", count: 1 },
      { label: "33", count: 2 },
      { label: "INF", count: 1 },
      { label: "other", count: 2 },
    ]);
  });

  it("ベストEXスコアが無い・0以下の譜面は数えない", () => {
    const result = aggregateBestVersionCounts(
      [row("34", 0), row("34", null), row("34", 10)],
      { levels: [], difficulties: [] },
    );
    expect(result).toEqual([{ label: "34", count: 1 }]);
  });

  it("レベル・難易度フィルタを適用する", () => {
    const result = aggregateBestVersionCounts(
      [row("34", 100, 11, "HYPER"), row("34", 100, 12, "ANOTHER")],
      { levels: [12], difficulties: ["ANOTHER"] },
    );
    expect(result).toEqual([{ label: "34", count: 1 }]);
  });
});
