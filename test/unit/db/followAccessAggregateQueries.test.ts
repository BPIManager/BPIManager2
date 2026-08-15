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

const { followAccessAggregateRepo } = await import(
  "@/lib/db/aggregates/followAccess"
);

describe("followAccessAggregateRepo.listUnapprovedFollowers", () => {
  it("対象ユーザーが現在非公開であることを絞り込み条件に含めること(#275 公開ユーザーで全フォロワーが未承認扱いになる不具合の回帰防止)", async () => {
    dbHolder.current = createDbSpy([]);

    await followAccessAggregateRepo.listUnapprovedFollowers("target-1");

    const whereCalls = callsFor(dbHolder.current.calls, "where");
    expect(
      whereCalls.some(
        (c) => c.args[0] === "target.isPublic" && c.args[2] === 0,
      ),
    ).toBe(true);
  });

  it("target.userIdでfollowsのfollowingIdと結合すること", async () => {
    dbHolder.current = createDbSpy([]);

    await followAccessAggregateRepo.listUnapprovedFollowers("target-1");

    const joinCalls = callsFor(dbHolder.current.calls, "innerJoin");
    expect(
      joinCalls.some(
        (c) => c.args[0] === "users as target" && c.args[1] === "target.userId",
      ),
    ).toBe(true);
  });
});

describe("followAccessAggregateRepo.countUnapprovedFollowers", () => {
  it("対象ユーザーが現在非公開であることを絞り込み条件に含めること", async () => {
    dbHolder.current = createDbSpy({ cnt: 0 });

    await followAccessAggregateRepo.countUnapprovedFollowers("target-1");

    const whereCalls = callsFor(dbHolder.current.calls, "where");
    expect(
      whereCalls.some(
        (c) => c.args[0] === "target.isPublic" && c.args[2] === 0,
      ),
    ).toBe(true);
  });
});
