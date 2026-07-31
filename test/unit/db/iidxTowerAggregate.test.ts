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

const { iidxTowerAggregateRepo } = await import("@/lib/db/aggregates/iidxTower");

describe("iidxTowerAggregateRepo.getTowerRanking", () => {
  it("期間・バージョンで絞り込み集計結果を返すこと", async () => {
    const rows = [{ userId: "user-1", totalCount: 300 }];
    dbHolder.current = createDbSpy(rows);

    const result = await iidxTowerAggregateRepo.getTowerRanking({
      version: "33",
      startDate: "2025-06-01",
      endDate: "2025-06-30",
    });

    expect(result).toEqual(rows);
    const whereCalls = callsFor(dbHolder.current.calls, "where");
    expect(whereCalls[0].args).toEqual(["t.version", "=", "33"]);
  });
});
