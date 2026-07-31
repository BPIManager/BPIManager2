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

const { iidxTowerRepo } = await import("@/lib/db/domains/iidxTower");

describe("iidxTowerRepo.upsertRows", () => {
  it("rowsが空の場合、DB操作を行わず0を返すこと", async () => {
    dbHolder.current = createDbSpy(undefined);
    const result = await iidxTowerRepo.upsertRows("user-1", "33", []);
    expect(result).toBe(0);
    expect(dbHolder.current.calls).toHaveLength(0);
  });

  it("rowsがある場合、userId/versionを付与してupsertし件数を返すこと", async () => {
    dbHolder.current = createDbSpy(undefined);
    const rows = [
      { playDate: "2025-06-01", keyCount: 100, scratchCount: 10 },
      { playDate: "2025-06-02", keyCount: 200, scratchCount: 20 },
    ];

    const result = await iidxTowerRepo.upsertRows("user-1", "33", rows);

    expect(result).toBe(2);
    const valuesCall = callsFor(dbHolder.current.calls, "values")[0];
    expect(valuesCall.args[0]).toEqual([
      { userId: "user-1", version: "33", ...rows[0] },
      { userId: "user-1", version: "33", ...rows[1] },
    ]);
  });
});

describe("iidxTowerRepo.getByUser", () => {
  it("versionが指定された場合、追加のwhereが適用されること", async () => {
    dbHolder.current = createDbSpy([]);
    await iidxTowerRepo.getByUser("user-1", "33");
    const whereCalls = callsFor(dbHolder.current.calls, "where");
    expect(whereCalls).toHaveLength(2);
    expect(whereCalls[1].args).toEqual(["version", "=", "33"]);
  });

  it("versionが未指定の場合、userIdのwhereのみになること", async () => {
    dbHolder.current = createDbSpy([]);
    await iidxTowerRepo.getByUser("user-1");
    expect(callsFor(dbHolder.current.calls, "where")).toHaveLength(1);
  });
});

describe("iidxTowerRepo.getLatest", () => {
  it("デフォルトlimit=30で取得すること", async () => {
    dbHolder.current = createDbSpy([]);
    await iidxTowerRepo.getLatest("user-1", "33");
    expect(callsFor(dbHolder.current.calls, "limit")[0].args).toEqual([30]);
  });

  it("limitを指定できること", async () => {
    dbHolder.current = createDbSpy([]);
    await iidxTowerRepo.getLatest("user-1", "33", 7);
    expect(callsFor(dbHolder.current.calls, "limit")[0].args).toEqual([7]);
  });
});

describe("iidxTowerRepo.getTowerRanking", () => {
  it("期間・バージョンで絞り込み集計結果を返すこと", async () => {
    const rows = [{ userId: "user-1", totalCount: 300 }];
    dbHolder.current = createDbSpy(rows);

    const result = await iidxTowerRepo.getTowerRanking({
      version: "33",
      startDate: "2025-06-01",
      endDate: "2025-06-30",
    });

    expect(result).toEqual(rows);
    const whereCalls = callsFor(dbHolder.current.calls, "where");
    expect(whereCalls[0].args).toEqual(["t.version", "=", "33"]);
  });
});
