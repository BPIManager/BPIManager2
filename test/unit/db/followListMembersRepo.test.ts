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

const { followListMembersRepo } = await import(
  "@/lib/db/domains/followListMembers"
);

describe("followListMembersRepo.addMember", () => {
  it("listId・followingIdでinsertすること", async () => {
    const spy = createDbSpy(undefined);
    dbHolder.current = spy;

    await followListMembersRepo.addMember(1, "user-2");

    expect(callsFor(spy.calls, "insertInto")[0].args).toEqual([
      "followListMembers",
    ]);
    expect(callsFor(spy.calls, "values")[0].args).toEqual([
      { listId: 1, followingId: "user-2" },
    ]);
  });
});

describe("followListMembersRepo.removeMember", () => {
  it("削除対象が存在すればtrueを返すこと", async () => {
    const spy = createDbSpy({ numDeletedRows: 1 });
    dbHolder.current = spy;

    expect(await followListMembersRepo.removeMember(1, "user-2")).toBe(true);
    const whereCalls = callsFor(spy.calls, "where");
    expect(whereCalls[0].args).toEqual(["listId", "=", 1]);
    expect(whereCalls[1].args).toEqual(["followingId", "=", "user-2"]);
  });

  it("削除対象が存在しなければfalseを返すこと", async () => {
    const spy = createDbSpy({ numDeletedRows: 0 });
    dbHolder.current = spy;

    expect(await followListMembersRepo.removeMember(1, "user-2")).toBe(false);
  });
});

describe("followListMembersRepo.getFollowingIdsForList", () => {
  it("所属ユーザーIDの配列を返すこと", async () => {
    const spy = createDbSpy([
      { followingId: "user-2" },
      { followingId: "user-3" },
    ]);
    dbHolder.current = spy;

    const result = await followListMembersRepo.getFollowingIdsForList(1);

    expect(result).toEqual(["user-2", "user-3"]);
  });
});

describe("followListMembersRepo.getAllForLists", () => {
  it("listIdsが空の場合、DBに問い合わせず空配列を返すこと", async () => {
    const spy = createDbSpy([]);
    dbHolder.current = spy;

    const result = await followListMembersRepo.getAllForLists([]);

    expect(result).toEqual([]);
    expect(spy.calls).toHaveLength(0);
  });

  it("listIdsで絞り込んで全件取得すること", async () => {
    const rows = [{ id: 1, listId: 10, followingId: "user-2", createdAt: new Date() }];
    const spy = createDbSpy(rows);
    dbHolder.current = spy;

    const result = await followListMembersRepo.getAllForLists([10, 20]);

    expect(result).toEqual(rows);
    expect(callsFor(spy.calls, "where")[0].args).toEqual([
      "listId",
      "in",
      [10, 20],
    ]);
  });
});

describe("followListMembersRepo.deleteByFollowingForOwner", () => {
  it("ownerId所有のリストのうちfollowingIdを外すこと", async () => {
    const spy = createDbSpy(undefined);
    dbHolder.current = spy;

    await followListMembersRepo.deleteByFollowingForOwner(
      spy.db as never,
      "owner-1",
      "user-2",
    );

    expect(callsFor(spy.calls, "deleteFrom")[0].args).toEqual([
      "followListMembers",
    ]);
    // where呼び出しの評価順: 外側delete条件(followingId) →
    // サブクエリ(followLists所有者条件、値として先に評価される) →
    // 外側delete条件(listId in サブクエリ)
    const whereCalls = callsFor(spy.calls, "where");
    expect(whereCalls[0].args).toEqual(["followingId", "=", "user-2"]);
    expect(whereCalls[1].args).toEqual(["userId", "=", "owner-1"]);
    expect(whereCalls[2].args[0]).toBe("listId");
    expect(whereCalls[2].args[1]).toBe("in");
    expect(callsFor(spy.calls, "selectFrom")[0].args).toEqual([
      "followLists",
    ]);
  });
});
