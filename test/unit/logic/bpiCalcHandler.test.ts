import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/cache/songDefs", () => ({
  getSongWithDefCached: vi.fn(async () => ({
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
  })),
}));
vi.mock("@/lib/cache/arenaAverages", () => ({ getArenaAverages: vi.fn() }));
vi.mock("@/lib/db/domains/scores/activity", () => ({
  scoreActivityRepo: { getSongBpimRank: vi.fn() },
}));

import { handleBpiCalc } from "@/lib/subhandlers/site/bpiCalc";

const req = (query: Record<string, string>) =>
  ({ query: { title: "T", difficulty: "ANOTHER", exScore: "1700", ...query } }) as never;
const bodyOf = (r: unknown) => (r as { body: Record<string, unknown> }).body;

describe("handleBpiCalc の model パラメータ", () => {
  it("v2 ルート: model=both で V1 と V2 の両方を返し、bpi は V2 の値になる", async () => {
    const b = bodyOf(await handleBpiCalc(req({ model: "both" }), { allowModel: true }));
    const models = b.models as { v1: number; v2: number };
    expect(typeof models.v1).toBe("number");
    expect(typeof models.v2).toBe("number");
    expect(models.v1).not.toBe(models.v2);
    expect(b.bpi).toBe(models.v2);
  });

  it("v2 ルート: model=v1 では bpi が V1 の値になり、推定順位は出さない", async () => {
    const both = bodyOf(await handleBpiCalc(req({ model: "both" }), { allowModel: true }));
    const b = bodyOf(await handleBpiCalc(req({ model: "v1" }), { allowModel: true }));
    expect(b.bpi).toBe((both.models as { v1: number }).v1);
    expect((b.rank as { estimatedRank: unknown }).estimatedRank).toBeNull();
    expect(b.models).toBeUndefined();
  });

  it("v1 ルート（allowModel なし）: model を指定しても従来どおり V2 の値で、models は含まない", async () => {
    const b = bodyOf(await handleBpiCalc(req({ model: "v1" })));
    const v2 = bodyOf(await handleBpiCalc(req({ model: "both" }), { allowModel: true }));
    expect(b.bpi).toBe((v2.models as { v2: number }).v2);
    expect(b.models).toBeUndefined();
    expect((b.metadata as Record<string, unknown>).model).toBeUndefined();
  });

  it("不正な model は 400", async () => {
    const r = await handleBpiCalc(req({ model: "v3" }), { allowModel: true });
    expect(r).toMatchObject({ ok: false, status: 400 });
  });
});
