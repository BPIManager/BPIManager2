import { describe, it, expect } from "vitest";
import { buildBeforeScores, buildRadarGrowthSnapshot } from "@/lib/radar/growth";

const score = (songId: number, exScore: number, bpi: number | null = 0) => ({
  songId,
  title: `song${songId}`,
  difficulty: "ANOTHER",
  exScore,
  bpi,
  notes: 1000,
});

describe("buildBeforeScores", () => {
  it("期間内に更新された曲は更新前スコアへ戻す", () => {
    const after = [score(1, 1800, 10), score(2, 1500, 5)];
    const before = buildBeforeScores(after, [
      { ...score(1, 1800, 10), prevExScore: 1700, prevBpi: 8 },
    ]);
    expect(before).toEqual([score(1, 1700, 8), score(2, 1500, 5)]);
  });

  it("期間内の新規記録（更新前なし）は除外する", () => {
    const after = [score(1, 1800), score(2, 1500)];
    const before = buildBeforeScores(after, [
      { ...score(2, 1500), prevExScore: null, prevBpi: null },
    ]);
    expect(before).toEqual([score(1, 1800)]);
  });

  it("期間内の更新が無ければ変化しない", () => {
    const after = [score(1, 1800)];
    expect(buildBeforeScores(after, [])).toEqual(after);
  });
});

describe("buildRadarGrowthSnapshot", () => {
  it("カテゴリごとに差分を計算する", () => {
    const mk = (v: number) => ({ totalBpi: v });
    const before = { NOTES: mk(10), CHORD: mk(20), PEAK: mk(0), CHARGE: mk(0), SCRATCH: mk(5), SOFLAN: mk(0) };
    const after = { ...before, NOTES: mk(12.5), SCRATCH: mk(4) };
    const snap = buildRadarGrowthSnapshot(before, after);
    const notes = snap.categories.find((c) => c.category === "NOTES")!;
    const scratch = snap.categories.find((c) => c.category === "SCRATCH")!;
    const chord = snap.categories.find((c) => c.category === "CHORD")!;
    expect(notes).toEqual({ category: "NOTES", before: 10, after: 12.5, diff: 2.5 });
    expect(scratch.diff).toBe(-1);
    expect(chord.diff).toBe(0);
  });
});
