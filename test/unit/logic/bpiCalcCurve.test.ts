import { describe, it, expect, vi } from "vitest";

const song = {
  songId: 1,
  title: "T",
  difficulty: "ANOTHER",
  difficultyLevel: 10,
  notes: 1000,
  kaidenAvg: 1600,
  wrScore: 1950,
  coef: 1.2,
  mu: 0.4,
  sigma: 0.3,
  residualVar: 0.04,
};

vi.mock("@/lib/cache/songDefs", () => ({
  getSongWithDefCached: vi.fn(async (title: string) => (title === "T" ? song : null)),
}));
vi.mock("@/lib/cache/arenaAverages", () => ({ getArenaAverages: vi.fn() }));
vi.mock("@/lib/db/domains/scores/activity", () => ({
  scoreActivityRepo: { getSongBpimRank: vi.fn() },
}));

import { handleBpiCalc } from "@/lib/subhandlers/site/bpiCalc";

const req = (query: Record<string, string>) =>
  ({ query: { title: "T", difficulty: "ANOTHER", exScore: "1700", ...query } }) as never;
const bodyOf = (r: unknown) => (r as { body: Record<string, unknown> }).body;

describe("handleBpiCalc の includeCurve", () => {
  it("includeCurve=true で BPI 100〜0 に必要な EX スコアを返し、スコアは 0〜最大スコアの整数", async () => {
    const curve = bodyOf(await handleBpiCalc(req({ includeCurve: "true" }))).curve as { bpi: number; score: number }[];
    expect(curve.map((c) => c.bpi)).toEqual([100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0]);
    for (const c of curve) {
      expect(Number.isInteger(c.score)).toBe(true);
      expect(c.score).toBeGreaterThanOrEqual(0);
      expect(c.score).toBeLessThanOrEqual(song.notes * 2);
    }
  });

  it("includeCurve を付けない、または true 以外では curve を返さず、既存のレスポンスは変わらない", async () => {
    const b = bodyOf(await handleBpiCalc(req({})));
    expect(b.curve).toBeUndefined();
    expect(bodyOf(await handleBpiCalc(req({ includeCurve: "false" }))).curve).toBeUndefined();
    expect(Object.keys(b).sort()).toEqual(["bpi", "metadata", "rank", "song"]);
  });
});
