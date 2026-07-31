import { describe, it, expect, vi } from "vitest";
import { createDbSpy, callsFor } from "../helpers/dbQuerySpy";

const { dbHolder } = vi.hoisted(() => ({
  dbHolder: {
    current: null as ReturnType<
      typeof import("../helpers/dbQuerySpy")["createDbSpy"]
    > | null,
  },
}));

vi.mock("@/lib/db", () => ({
  get db() {
    return dbHolder.current!.db;
  },
}));

const { bpiRepo } = await import("@/lib/db/bpi");

describe("bpiRepo.getLatestScores / getLatestAllScores", () => {
  it("scoresテーブルから最新スコアを取得すること", async () => {
    dbHolder.current = createDbSpy([]);
    await bpiRepo.getLatestScores("user-1", "33");
    expect(callsFor(dbHolder.current.calls, "selectFrom")[0].args).toEqual([
      "scores",
    ]);
  });

  it("allScoresテーブルから最新スコアを取得すること", async () => {
    dbHolder.current = createDbSpy([]);
    await bpiRepo.getLatestAllScores("user-1", "33");
    expect(callsFor(dbHolder.current.calls, "selectFrom")[0].args).toEqual([
      "allScores",
    ]);
  });
});

describe("bpiRepo.getLatestTotalBpi", () => {
  it("userId/versionで絞り込み最新1件を取得すること", async () => {
    dbHolder.current = createDbSpy({ totalBpi: 30 });
    const result = await bpiRepo.getLatestTotalBpi("user-1", "33");
    expect(result).toEqual({ totalBpi: 30 });
    expect(callsFor(dbHolder.current.calls, "limit")[0].args).toEqual([1]);
    expect(callsFor(dbHolder.current.calls, "orderBy")[0].args).toEqual([
      "id",
      "desc",
    ]);
  });
});

describe("bpiRepo.getSongBpimRank", () => {
  it("above件数+1をrankとして返すこと", async () => {
    dbHolder.current = createDbSpy({ total: 100, above: 4 });
    const result = await bpiRepo.getSongBpimRank(1, 1800);
    expect(result).toEqual({ rank: 5, total: 100 });
  });

  it("結果がundefinedの場合rank=1, total=0を返すこと", async () => {
    dbHolder.current = createDbSpy(undefined);
    const result = await bpiRepo.getSongBpimRank(1, 1800);
    expect(result).toEqual({ rank: 1, total: 0 });
  });
});

