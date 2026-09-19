import { describe, it, expect } from "vitest";
import { sortStepsByOrder } from "@/components/partials/common/OptimizerGoalCard";

interface Step {
  songId: number;
  toExScore: number;
  currentExScore: number | null;
  fromBpi: number;
  toBpi: number;
  currentBpi: number | null;
}

const steps: Step[] = [
  {
    songId: 1,
    toExScore: 1900,
    currentExScore: 1000, // remaining score 900
    fromBpi: -15,
    toBpi: 30,
    currentBpi: 10, // remaining bpi 20
  },
  {
    songId: 2,
    toExScore: 1900,
    currentExScore: 1900, // achieved (remaining score 0)
    fromBpi: -15,
    toBpi: 30,
    currentBpi: 30,
  },
  {
    songId: 3,
    toExScore: 1900,
    currentExScore: 1800, // remaining score 100
    fromBpi: -15,
    toBpi: 30,
    currentBpi: 25, // remaining bpi 5
  },
  {
    songId: 4,
    toExScore: 1900,
    currentExScore: null, // unplayed (remaining score 1900)
    fromBpi: -15,
    toBpi: 30,
    currentBpi: null, // remaining bpi 45 (toBpi - fromBpi)
  },
];

describe("sortStepsByOrder", () => {
  it("「スコアが近い順」では達成済みの曲を除いた中で残りスコアが少ない順になり、達成済みは末尾に固定されること", () => {
    const sorted = sortStepsByOrder(steps, "scoreNearest");
    expect(sorted.map((s) => s.songId)).toEqual([3, 1, 4, 2]);
  });

  it("「スコアが遠い順」でも達成済みの曲は末尾に固定されること", () => {
    const sorted = sortStepsByOrder(steps, "scoreFarthest");
    expect(sorted.map((s) => s.songId)).toEqual([4, 1, 3, 2]);
  });

  it("「BPIが近い順」では達成済みの曲を除いた中で残りBPIが少ない順になり、達成済みは末尾に固定されること", () => {
    const sorted = sortStepsByOrder(steps, "bpiNearest");
    expect(sorted.map((s) => s.songId)).toEqual([3, 1, 4, 2]);
  });

  it("「BPIが遠い順」でも達成済みの曲は末尾に固定されること", () => {
    const sorted = sortStepsByOrder(steps, "bpiFarthest");
    expect(sorted.map((s) => s.songId)).toEqual([4, 1, 3, 2]);
  });

  it("「追加した順」は元の順序をそのまま維持すること", () => {
    const sorted = sortStepsByOrder(steps, "added");
    expect(sorted.map((s) => s.songId)).toEqual([1, 2, 3, 4]);
  });
});
