import { describe, it, expect } from "vitest";
import { sortStepsByOrder } from "@/components/partials/common/OptimizerGoalCard";

interface Step {
  songId: number;
  toExScore: number;
  currentExScore: number | null;
}

const steps: Step[] = [
  { songId: 1, toExScore: 1900, currentExScore: 1000 }, // remaining 900
  { songId: 2, toExScore: 1900, currentExScore: 1900 }, // achieved (remaining 0)
  { songId: 3, toExScore: 1900, currentExScore: 1800 }, // remaining 100
  { songId: 4, toExScore: 1900, currentExScore: null }, // unplayed (remaining 1900)
];

describe("sortStepsByOrder", () => {
  it("「近い順」では達成済みの曲を除いた中で残りが少ない順になり、達成済みは末尾に固定されること", () => {
    const sorted = sortStepsByOrder(steps, "nearest");
    expect(sorted.map((s) => s.songId)).toEqual([3, 1, 4, 2]);
  });

  it("「遠い順」でも達成済みの曲は末尾に固定されること", () => {
    const sorted = sortStepsByOrder(steps, "farthest");
    expect(sorted.map((s) => s.songId)).toEqual([4, 1, 3, 2]);
  });

  it("「追加した順」は元の順序をそのまま維持すること", () => {
    const sorted = sortStepsByOrder(steps, "added");
    expect(sorted.map((s) => s.songId)).toEqual([1, 2, 3, 4]);
  });
});
