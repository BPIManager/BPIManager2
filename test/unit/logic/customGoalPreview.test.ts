import { describe, it, expect, vi } from "vitest";
import { createDbSpy } from "../helpers/dbQuerySpy";
import { BpiCalculator } from "@/lib/bpi";

const { dbHolder } = vi.hoisted(() => ({
  dbHolder: { current: null as ReturnType<typeof import("../helpers/dbQuerySpy")["createDbSpy"]> | null },
}));

vi.mock("@/lib/db", () => ({
  get db() {
    return dbHolder.current!.db;
  },
}));

const { handleCustomGoalPreview } = await import(
  "@/lib/subhandlers/bpiOptimizer/customPreview"
);

/**
 * findOptimalBpiPathのテスト(test/unit/logic/bpiOptimizer.test.ts)と同じ校正値。
 * notes=1000, kaidenAvg=1750, wrScore=1980のときkaidenAvg付近でBPI≈0、
 * wrScore付近でBPI≈100になる。
 */
const FIXTURE_MU = -5.521460917862246;
const FIXTURE_SIGMA = 0.3157160805385319;

function makeRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    songId: 1,
    title: "テスト曲",
    notes: 1000,
    difficulty: "ANOTHER",
    difficultyLevel: 12,
    wrScore: 1980,
    kaidenAvg: 1750,
    coef: 1,
    mu: FIXTURE_MU,
    sigma: FIXTURE_SIGMA,
    residualVar: null,
    exScore: null,
    ...overrides,
  };
}

function makeReq(body: unknown, userId = "user-1") {
  return { query: { userId }, body } as unknown as import("next").NextApiRequest;
}

describe("handleCustomGoalPreview", () => {
  it("未知のsongIdが含まれる場合は400エラーを返すこと", async () => {
    dbHolder.current = createDbSpy([makeRow({ songId: 1 })]);

    const { result } = await handleCustomGoalPreview(
      makeReq({ targets: [{ songId: 999, toExScore: 1900 }] }),
      {},
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });

  it("各曲のfromBpi/toBpiがBpiCalculator.calcと一致すること", async () => {
    dbHolder.current = createDbSpy([
      makeRow({ songId: 1, exScore: 1850 }),
      makeRow({ songId: 2, title: "フィラー", mu: null, sigma: null, exScore: null }),
    ]);

    const { result } = await handleCustomGoalPreview(
      makeReq({ targets: [{ songId: 1, toExScore: 1900 }] }),
      {},
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const step = result.body.steps[0];
    const song = {
      notes: 1000,
      kaidenAvg: 1750,
      wrScore: 1980,
      coef: 1,
      mu: FIXTURE_MU,
      sigma: FIXTURE_SIGMA,
      residualVar: null,
    };
    expect(step.fromBpi).toBeCloseTo(BpiCalculator.calc(1850, song)!, 5);
    expect(step.toBpi).toBeCloseTo(BpiCalculator.calc(1900, song)!, 5);
    expect(step.fromExScore).toBe(1850);
    expect(step.isUnplayed).toBe(false);
  });

  it("未プレイ曲(exScore無し)を目標指定した場合、fromExScoreはnull・isUnplayedはtrueになること", async () => {
    dbHolder.current = createDbSpy([
      makeRow({ songId: 1, exScore: null }),
      makeRow({ songId: 2, title: "フィラー", mu: null, sigma: null, exScore: null }),
    ]);

    const { result } = await handleCustomGoalPreview(
      makeReq({ targets: [{ songId: 1, toExScore: 1900 }] }),
      {},
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const step = result.body.steps[0];
    expect(step.fromExScore).toBeNull();
    expect(step.isUnplayed).toBe(true);
  });

  it("目標適用後の総合BPI(targetTotalBpi)が現在の総合BPI(currentTotalBpi)以上になること", async () => {
    dbHolder.current = createDbSpy([
      makeRow({ songId: 1, exScore: 1800 }),
      makeRow({ songId: 2, title: "フィラー", mu: null, sigma: null, exScore: null }),
    ]);

    const { result } = await handleCustomGoalPreview(
      makeReq({ targets: [{ songId: 1, toExScore: 1950 }] }),
      {},
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.body.targetTotalBpi).toBeGreaterThanOrEqual(
      result.body.currentTotalBpi,
    );
    expect(result.body.alreadyAchieved).toBe(false);
  });
});
