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

const { handleSongContribution } = await import(
  "@/lib/subhandlers/bpiOptimizer/songContribution"
);

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

describe("handleSongContribution", () => {
  it("スコアを更新していない曲の寄与は0になること", async () => {
    dbHolder.current = createDbSpy([
      makeRow({ songId: 1, exScore: 1850 }),
      makeRow({ songId: 2, title: "フィラー", exScore: 1800 }),
    ]);

    const { result } = await handleSongContribution(
      makeReq({ targets: [{ songId: 1, baselineExScore: 1850 }] }),
      {},
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.body.contributions[0].contribution).toBeCloseTo(0, 6);
  });

  it("スコアを更新した曲を保存時点(baseline)に戻すと総合BPIが下がり、その差分が正の寄与になること", async () => {
    dbHolder.current = createDbSpy([
      makeRow({ songId: 1, exScore: 1900 }),
      makeRow({ songId: 2, title: "フィラー", exScore: 1800 }),
    ]);

    const { result } = await handleSongContribution(
      makeReq({ targets: [{ songId: 1, baselineExScore: 1850 }] }),
      {},
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.body.contributions[0].contribution).toBeGreaterThan(0);
  });

  it("保存時点で未プレイ(baseline null)だった曲は、現在のプレイ実績が丸ごと寄与として計算されること", async () => {
    dbHolder.current = createDbSpy([
      makeRow({ songId: 1, exScore: 1900 }),
      makeRow({ songId: 2, title: "フィラー", exScore: 1800 }),
    ]);

    const withBaseline = await handleSongContribution(
      makeReq({ targets: [{ songId: 1, baselineExScore: null }] }),
      {},
    );
    const song = {
      notes: 1000,
      kaidenAvg: 1750,
      wrScore: 1980,
      coef: 1,
      mu: FIXTURE_MU,
      sigma: FIXTURE_SIGMA,
      residualVar: null,
    };

    expect(withBaseline.result.ok).toBe(true);
    if (!withBaseline.result.ok) return;
    // songId=1を観測から完全に除いた場合との差分になるはず
    const currentTotal = withBaseline.result.body.currentTotalBpi;
    expect(currentTotal).toBeGreaterThan(0);
    expect(withBaseline.result.body.contributions[0].contribution).toBeGreaterThan(0);
    // 参考: 単曲BPIそのものより小さい値になる(総合BPIはべき乗平均のため)
    const soloBpi = BpiCalculator.calc(1900, song)!;
    expect(withBaseline.result.body.contributions[0].contribution).toBeLessThan(soloBpi);
  });

  it("未知のsongIdが含まれる場合は400エラーを返すこと", async () => {
    dbHolder.current = createDbSpy([makeRow({ songId: 1 })]);

    const { result } = await handleSongContribution(
      makeReq({ targets: [{ songId: 999, baselineExScore: 1000 }] }),
      {},
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });
});
