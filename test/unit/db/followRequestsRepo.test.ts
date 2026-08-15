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

const { followRequestsRepo } = await import("@/lib/db/domains/followRequests");

describe("followRequestsRepo.create", () => {
  it("requesterId/targetUserIdでpendingリクエストを作成すること", async () => {
    const spy = createDbSpy(undefined);
    dbHolder.current = spy;

    await followRequestsRepo.create("requester-1", "target-1");

    const insertCalls = callsFor(spy.calls, "insertInto");
    expect(insertCalls[0].args).toEqual(["followRequests"]);
    const valuesCalls = callsFor(spy.calls, "values");
    expect(valuesCalls[0].args).toEqual([
      { requesterId: "requester-1", targetUserId: "target-1" },
    ]);
    // 重複送信(既存pendingへの再送信)に対応するためonDuplicateKeyUpdateを使う
    expect(callsFor(spy.calls, "onDuplicateKeyUpdate")).toHaveLength(1);
  });
});

describe("followRequestsRepo.countPendingForTarget", () => {
  it("targetUserIdで絞り込んだ件数を返すこと", async () => {
    const spy = createDbSpy({ cnt: 3 });
    dbHolder.current = spy;

    const result = await followRequestsRepo.countPendingForTarget("target-1");

    expect(result).toBe(3);
    expect(callsFor(spy.calls, "where")[0].args).toEqual([
      "targetUserId",
      "=",
      "target-1",
    ]);
  });

  it("結果がundefinedの場合0を返すこと", async () => {
    const spy = createDbSpy(undefined);
    dbHolder.current = spy;

    expect(await followRequestsRepo.countPendingForTarget("target-1")).toBe(0);
  });
});

describe("followRequestsRepo.withdraw", () => {
  it("requesterId/targetUserIdが一致する行を削除しtrueを返すこと", async () => {
    const spy = createDbSpy({ numDeletedRows: 1n });
    dbHolder.current = spy;

    const result = await followRequestsRepo.withdraw("requester-1", "target-1");

    expect(result).toBe(true);
    const whereCalls = callsFor(spy.calls, "where");
    expect(whereCalls[0].args).toEqual(["requesterId", "=", "requester-1"]);
    expect(whereCalls[1].args).toEqual(["targetUserId", "=", "target-1"]);
  });

  it("対象が存在しない場合falseを返すこと", async () => {
    const spy = createDbSpy({ numDeletedRows: 0n });
    dbHolder.current = spy;

    const result = await followRequestsRepo.withdraw("requester-1", "target-1");

    expect(result).toBe(false);
  });
});

describe("followRequestsRepo.reject", () => {
  it("id/targetUserIdが一致する行を削除しtrueを返すこと(本人確認込み)", async () => {
    const spy = createDbSpy({ numDeletedRows: 1n });
    dbHolder.current = spy;

    const result = await followRequestsRepo.reject(1, "target-1");

    expect(result).toBe(true);
    const whereCalls = callsFor(spy.calls, "where");
    expect(whereCalls[0].args).toEqual(["id", "=", 1]);
    expect(whereCalls[1].args).toEqual(["targetUserId", "=", "target-1"]);
  });

  it("targetUserIdが一致しない場合falseを返すこと", async () => {
    const spy = createDbSpy({ numDeletedRows: 0n });
    dbHolder.current = spy;

    const result = await followRequestsRepo.reject(1, "someone-else");

    expect(result).toBe(false);
  });
});
