import { describe, it, expect, vi } from "vitest";
import {
  createDbSpy,
  createTransactionalDbSpy,
  callsFor,
} from "../helpers/dbQuerySpy";

const { dbHolder } = vi.hoisted(() => ({
  dbHolder: { current: null as unknown },
}));

vi.mock("@/lib/db", () => ({
  get db() {
    return (dbHolder.current as { db: unknown }).db;
  },
}));

const { followsRepo } = await import("@/lib/db/domains/follow");

describe("followsRepo.isFollowing", () => {
  it("レコードが存在すればtrueを返すこと", async () => {
    const spy = createDbSpy({ id: 1 });
    dbHolder.current = spy;
    expect(await followsRepo.isFollowing("a", "b")).toBe(true);
  });

  it("レコードが存在しなければfalseを返すこと", async () => {
    const spy = createDbSpy(undefined);
    dbHolder.current = spy;
    expect(await followsRepo.isFollowing("a", "b")).toBe(false);
  });
});

describe("followsRepo.followerCountSubquery / followingCountSubquery / isFollowingSubquery", () => {
  it("followerCountSubqueryはfollowingIdで絞り込むクエリを組み立てること", () => {
    const spy = createDbSpy(undefined);
    dbHolder.current = spy;
    followsRepo.followerCountSubquery("user-1");
    expect(callsFor(spy.calls, "where")[0].args).toEqual([
      "followingId",
      "=",
      "user-1",
    ]);
  });

  it("followingCountSubqueryはfollowerIdで絞り込むクエリを組み立てること", () => {
    const spy = createDbSpy(undefined);
    dbHolder.current = spy;
    followsRepo.followingCountSubquery("user-1");
    expect(callsFor(spy.calls, "where")[0].args).toEqual([
      "followerId",
      "=",
      "user-1",
    ]);
  });

  it("isFollowingSubqueryはfollowerId/followingId両方で絞り込むクエリを組み立てること", () => {
    const spy = createDbSpy(undefined);
    dbHolder.current = spy;
    followsRepo.isFollowingSubquery("user-1", "user-2");
    const whereCalls = callsFor(spy.calls, "where");
    expect(whereCalls[0].args).toEqual(["followerId", "=", "user-1"]);
    expect(whereCalls[1].args).toEqual(["followingId", "=", "user-2"]);
  });
});

describe("followsRepo.toggleFollow", () => {
  it("既にフォロー済みなら削除してfalseを返すこと", async () => {
    const spy = createTransactionalDbSpy({ id: 5 });
    dbHolder.current = spy;

    const result = await followsRepo.toggleFollow("a", "b");

    expect(result).toBe(false);
    expect(callsFor(spy.calls, "deleteFrom")[0].args).toEqual(["follows"]);
    expect(callsFor(spy.calls, "insertInto")).toHaveLength(0);
  });

  it("未フォローなら追加してtrueを返すこと", async () => {
    const spy = createTransactionalDbSpy(undefined);
    dbHolder.current = spy;

    const result = await followsRepo.toggleFollow("a", "b");

    expect(result).toBe(true);
    expect(callsFor(spy.calls, "insertInto")[0].args).toEqual(["follows"]);
    expect(callsFor(spy.calls, "deleteFrom")).toHaveLength(0);
  });
});

describe("followsRepo.removeInTransaction", () => {
  it("trxで削除対象が存在すればtrueを返すこと", async () => {
    const spy = createDbSpy({ numDeletedRows: 1 });
    dbHolder.current = spy;

    const result = await followsRepo.removeInTransaction(
      spy.db as never,
      "a",
      "b",
    );

    expect(result).toBe(true);
    expect(callsFor(spy.calls, "deleteFrom")[0].args).toEqual(["follows"]);
    const whereCalls = callsFor(spy.calls, "where");
    expect(whereCalls[0].args).toEqual(["followerId", "=", "a"]);
    expect(whereCalls[1].args).toEqual(["followingId", "=", "b"]);
  });

  it("削除対象が存在しなければfalseを返すこと", async () => {
    const spy = createDbSpy({ numDeletedRows: 0 });
    dbHolder.current = spy;

    expect(
      await followsRepo.removeInTransaction(spy.db as never, "a", "b"),
    ).toBe(false);
  });
});

describe("followsRepo.getFollowCounts", () => {
  it("フォロワー数とフォロー中数を数値で返すこと", async () => {
    const spy = createDbSpy({ count: 3 });
    dbHolder.current = spy;

    const result = await followsRepo.getFollowCounts("user-1");
    expect(result).toEqual({ followersCount: 3, followingCount: 3 });
  });

  it("結果がundefinedの場合0を返すこと", async () => {
    const spy = createDbSpy(undefined);
    dbHolder.current = spy;

    const result = await followsRepo.getFollowCounts("user-1");
    expect(result).toEqual({ followersCount: 0, followingCount: 0 });
  });
});
