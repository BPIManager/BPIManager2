import { describe, it, expect, vi } from "vitest";

// 総合BPIは「観測EXスコアの合計/100」とみなし、巻き戻しによる差を決定的に検証する
vi.mock("@/lib/bpi", () => ({
  BpiCalculator: {
    calculateTotalBPI: (obs: { exScore: number }[]) =>
      obs.reduce((sum, o) => sum + o.exScore, 0) / 100,
  },
}));
vi.mock("@/constants/iidx/radars/topElements", () => ({
  topElementMap: new Map([
    ["A___ANOTHER", "NOTES"],
    ["B___ANOTHER", "NOTES"],
    ["C___ANOTHER", "SCRATCH"],
  ]),
  topElementsByCategory: new Map([
    ["NOTES", [{ title: "A", difficulty: "ANOTHER" }, { title: "B", difficulty: "ANOTHER" }]],
    ["SCRATCH", [{ title: "C", difficulty: "ANOTHER" }]],
  ]),
}));

const { buildCategorySongImpacts } = await import("@/lib/radar/growth");

const master = new Map(
  [
    ["A___ANOTHER", 1],
    ["B___ANOTHER", 2],
    ["C___ANOTHER", 3],
  ].map(([k, id]) => [k as string, { songId: id as number, notes: 1000, kaidenAvg: 0, wrScore: 0 }]),
) as unknown as Parameters<typeof buildCategorySongImpacts>[3];
const valid = new Set(["A___ANOTHER", "B___ANOTHER", "C___ANOTHER"]);

const score = (songId: number, title: string, exScore: number) => ({
  songId,
  title,
  difficulty: "ANOTHER",
  exScore,
  bpi: exScore / 100,
  notes: 1000,
});

describe("buildCategorySongImpacts", () => {
  const after = [score(1, "A", 1800), score(2, "B", 1500), score(3, "C", 1700)];
  const period = [
    { ...score(1, "A", 1800), prevExScore: 1700, prevBpi: 17 },
    { ...score(2, "B", 1500), prevExScore: null, prevBpi: null },
    { ...score(3, "C", 1700), prevExScore: 1600, prevBpi: 16 },
  ];

  it("指定カテゴリの更新曲だけを、インパクトの大きい順に返す", () => {
    const result = buildCategorySongImpacts("NOTES", after, period, master, valid);
    // A: 1800→1700 の巻き戻しで -1.00 / B: 新規記録の除去で -15.00（大きい順）
    expect(result.map((r) => r.title)).toEqual(["B", "A"]);
    expect(result[0].impact).toBeCloseTo(15, 5);
    expect(result[1].impact).toBeCloseTo(1, 5);
  });

  it("更新前後のスコアを返し、新規記録の before は null", () => {
    const result = buildCategorySongImpacts("NOTES", after, period, master, valid);
    const a = result.find((r) => r.title === "A")!;
    expect(a.before).toEqual({ exScore: 1700, bpi: 17 });
    expect(a.after).toEqual({ exScore: 1800, bpi: 18 });
    expect(result.find((r) => r.title === "B")!.before).toBeNull();
  });

  it("他カテゴリの曲は含めない", () => {
    const result = buildCategorySongImpacts("SCRATCH", after, period, master, valid);
    expect(result.map((r) => r.title)).toEqual(["C"]);
  });
});
