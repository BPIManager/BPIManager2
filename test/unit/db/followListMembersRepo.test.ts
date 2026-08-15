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
