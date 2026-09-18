import { describe, it, expect, vi } from "vitest";

const calculateTotalBPIMock = vi.fn();

vi.mock("@/lib/bpi", () => ({
  BpiCalculator: {
    calculateTotalBPI: (...a: unknown[]) => calculateTotalBPIMock(...a),
    ratchetTotalBpi: (previousBest: number | null, freshValue: number) =>
      previousBest !== null ? Math.max(previousBest, freshValue) : freshValue,
  },
}));

import { calculateTotalBpi } from "@/services/logs/calculateTotalBpi";

describe("calculateTotalBpi", () => {
  it("未プレイ曲の予測下振れで生の総合BPIが下がっても、記録上は既知の最高値を下回らない(ラチェット)", () => {
    // 3日分。2日目は生の総合BPIが1日目より下がるが、表示上は下回らないはず
    calculateTotalBPIMock
      .mockReturnValueOnce(50) // day1
      .mockReturnValueOnce(45) // day2 (下振れ)
      .mockReturnValueOnce(55); // day3 (再度上昇)

    const scores = [
      { songId: 1, bpi: 50, exScore: 900, notes: 1000, difficultyLevel: 12, title: "a", playDay: "2024-01-01" },
      { songId: 2, bpi: 45, exScore: 800, notes: 1000, difficultyLevel: 12, title: "b", playDay: "2024-01-02" },
      { songId: 3, bpi: 55, exScore: 950, notes: 1000, difficultyLevel: 12, title: "c", playDay: "2024-01-03" },
    ];

    const timeline = calculateTotalBpi(scores, [], "31", 0);

    // timelineは新しい日付が先頭(降順)
    expect(timeline.map((t) => t.totalBpi)).toEqual([55, 50, 50]);
    // diffはラチェット後の値同士の差分であるべき(3日目は+5、2日目は0)
    expect(timeline.map((t) => t.diff)).toEqual([5, 0, 0]);
  });
});
