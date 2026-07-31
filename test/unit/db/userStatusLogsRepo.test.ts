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

const { userStatusLogsRepo } = await import("@/lib/db/userStatusLogs");

describe("userStatusLogsRepo.latestPerUserSubquery", () => {
  it("versionで絞り込みuserIdごとにグループ化するクエリを組み立てること", () => {
    dbHolder.current = createDbSpy(undefined);
    userStatusLogsRepo.latestPerUserSubquery("33");
    expect(callsFor(dbHolder.current.calls, "where")[0].args).toEqual([
      "version",
      "=",
      "33",
    ]);
    expect(callsFor(dbHolder.current.calls, "groupBy")[0].args).toEqual([
      "userId",
    ]);
  });
});

describe("userStatusLogsRepo.latestRowSubquery", () => {
  it("userId/versionで絞り込み最新1件に絞るクエリを組み立てること", () => {
    dbHolder.current = createDbSpy(undefined);
    userStatusLogsRepo.latestRowSubquery("user-1", "33");
    const whereCalls = callsFor(dbHolder.current.calls, "where");
    expect(whereCalls[0].args).toEqual(["userId", "=", "user-1"]);
    expect(whereCalls[1].args).toEqual(["version", "=", "33"]);
    expect(callsFor(dbHolder.current.calls, "limit")[0].args).toEqual([1]);
  });
});

describe("userStatusLogsRepo.getBpiHistoryByVersion", () => {
  it("バージョンごとの最新1件を結合して取得すること", async () => {
    const rows = [{ version: "33", totalBpi: 30 }];
    dbHolder.current = createDbSpy(rows);
    const result = await userStatusLogsRepo.getBpiHistoryByVersion("user-1");
    expect(result).toEqual(rows);
    expect(callsFor(dbHolder.current.calls, "selectFrom")[0].args).toEqual([
      "userStatusLogs as usl",
    ]);
  });
});
