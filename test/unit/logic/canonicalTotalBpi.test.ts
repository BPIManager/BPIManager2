import { describe, it, expect } from "vitest";
import { BpiCalculator } from "@/lib/bpi";
import { computeCanonicalTotalBpi } from "@/lib/bpi/canonicalTotalBpi";
import { NEW_BPI_Z0 } from "@/constants/iidx/newBpi/modelConstants";

function song(songId: number, difficultyLevel: number, kaidenAvg: number) {
  const notes = 1000;
  const sigma = 1;
  const mu = Math.log(kaidenAvg / (notes * 2 - kaidenAvg)) - NEW_BPI_Z0;
  return { songId, difficultyLevel, notes, kaidenAvg, wrScore: 1900, coef: 1.175, mu, sigma, residualVar: null };
}

describe("computeCanonicalTotalBpi", () => {
  const master = [song(1, 12, 1500), song(2, 12, 1500), song(3, 11, 1400)];
  const scores = [
    { songId: 1, notes: 1000, exScore: 1600 },
    { songId: 3, notes: 1000, exScore: 1500 },
  ];

  it("☆11+12の観測を使い、☆12のみを母数にすること", () => {
    const expected = BpiCalculator.calculateTotalBPI(
      scores.map((s) => ({ songId: s.songId, notes: s.notes, exScore: s.exScore })),
      master.filter((s) => s.difficultyLevel === 12),
    );
    expect(computeCanonicalTotalBpi(scores, master)).toBe(expected);
  });

  it("exScoreがnullの行は観測から除外すること", () => {
    const withNull = [...scores, { songId: 2, notes: 1000, exScore: null }];
    expect(computeCanonicalTotalBpi(withNull, master)).toBe(
      computeCanonicalTotalBpi(scores, master),
    );
  });
});
