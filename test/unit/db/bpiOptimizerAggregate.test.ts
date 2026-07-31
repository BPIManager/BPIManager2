import { describe, it, expect, vi } from "vitest";
import { createDbSpy, callsFor } from "../helpers/dbQuerySpy";

const { dbHolder } = vi.hoisted(() => ({
  dbHolder: { current: null as ReturnType<typeof import("../helpers/dbQuerySpy")["createDbSpy"]> | null },
}));

vi.mock("@/lib/db", () => ({
  get db() {
    return dbHolder.current!.db;
  },
}));

const { bpiOptimizerAggregateRepo } = await import(
  "@/lib/db/aggregates/bpiOptimizer"
);

describe("bpiOptimizerAggregateRepo.getAllSongsWithUserScores", () => {
  it("INF以外のバージョンでは$ifにtrueを渡してreleasedVersion等の条件を適用すること", async () => {
    dbHolder.current = createDbSpy([]);
    await bpiOptimizerAggregateRepo.getAllSongsWithUserScores("user-1", "33");
    const ifCalls = callsFor(dbHolder.current.calls, "$if");
    expect(ifCalls[0].args[0]).toBe(true);
  });

  it("INFバージョンでは$ifにfalseを渡すこと", async () => {
    dbHolder.current = createDbSpy([]);
    await bpiOptimizerAggregateRepo.getAllSongsWithUserScores("user-1", "INF");
    const ifCalls = callsFor(dbHolder.current.calls, "$if");
    expect(ifCalls[0].args[0]).toBe(false);
  });

  it("difficultyLevel=12・対象難易度のみに絞り込むこと", async () => {
    dbHolder.current = createDbSpy([]);
    await bpiOptimizerAggregateRepo.getAllSongsWithUserScores("user-1", "33");
    const whereCalls = callsFor(dbHolder.current.calls, "where");
    expect(whereCalls).toContainEqual({
      method: "where",
      args: ["m.difficultyLevel", "=", 12],
    });
  });
});
