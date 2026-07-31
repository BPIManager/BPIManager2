import { describe, it, expect, vi } from "vitest";
import { createDbSpy, callsFor } from "../helpers/dbQuerySpy";

const { dbHolder } = vi.hoisted(() => ({
  dbHolder: { current: null as unknown },
}));

vi.mock("@/lib/db", () => ({
  get db() {
    return (dbHolder.current as { db: unknown }).db;
  },
}));

const { userRankingRepo } = await import(
  "@/lib/db/aggregates/userProfiles/ranking"
);

describe("userRankingRepo.getGlobalRanking", () => {
  it("radarカテゴリの場合userRadarCacheを結合すること", async () => {
    const spy = createDbSpy([]);
    dbHolder.current = spy;
    await userRankingRepo.getGlobalRanking("33", "notes");
    const innerJoinCalls = callsFor(spy.calls, "innerJoin");
    expect(
      innerJoinCalls.some((c) =>
        String(c.args[0]).includes("userRadarCache"),
      ),
    ).toBe(true);
  });

  it("filterAreaが指定された場合、areaでの絞り込みを行うこと", async () => {
    const spy = createDbSpy([]);
    dbHolder.current = spy;
    await userRankingRepo.getGlobalRanking("33", "totalBpi", "東京都");
    const whereCalls = callsFor(spy.calls, "where");
    expect(whereCalls.some((c) => c.args[0] === "oas.area")).toBe(true);
  });
});
