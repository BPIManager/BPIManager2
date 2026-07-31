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

const { followsRepo } = await import("@/lib/db/follow");

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

describe("followsRepo.getFollowList", () => {
  function createFollowListDbSpy(countResult: unknown, usersResult: unknown) {
    const calls: { method: string; args: unknown[] }[] = [];
    const handler: ProxyHandler<object> = {
      get(_target, prop) {
        if (typeof prop !== "string") return undefined;
        return (...args: unknown[]) => {
          calls.push({ method: prop, args });
          if (prop === "executeTakeFirst") return Promise.resolve(countResult);
          if (prop === "execute") return Promise.resolve(usersResult);
          return proxy;
        };
      },
    };
    const proxy = new Proxy({}, handler);
    const dbHandler: ProxyHandler<object> = {
      get(_target, prop) {
        if (typeof prop !== "string") return undefined;
        return vi.fn((...args: unknown[]) => {
          calls.push({ method: prop, args });
          return proxy;
        });
      },
    };
    return { db: new Proxy({}, dbHandler), calls };
  }

  it("非公開ユーザーの情報をマスクすること", async () => {
    dbHolder.current = createFollowListDbSpy({ total: 2 }, [
      {
        userId: "public-user",
        userName: "公開ユーザー",
        profileImage: "img.png",
        profileText: "hello",
        isPublic: 1,
        totalBpi: "30.5",
        arenaClass: "A1",
        followedAt: "2025-01-01",
        isViewerFollowing: 1,
      },
      {
        userId: "private-user",
        userName: "非公開設定ユーザー",
        profileImage: "img2.png",
        profileText: "secret",
        isPublic: 0,
        totalBpi: "20",
        arenaClass: "B1",
        followedAt: "2025-01-02",
        isViewerFollowing: 0,
      },
    ]);

    const result = await followsRepo.getFollowList({
      targetUserId: "target-1",
      viewerId: "viewer-1",
      type: "followers",
      version: "33",
      page: 1,
      limit: 20,
    });

    expect(result.totalCount).toBe(2);
    expect(result.users[0]).toMatchObject({
      userId: "public-user",
      userName: "公開ユーザー",
      totalBpi: 30.5,
      isMasked: false,
      isViewerFollowing: true,
    });
    expect(result.users[1]).toMatchObject({
      userId: "",
      userName: "非公開ユーザー",
      profileImage: null,
      totalBpi: null,
      isMasked: true,
      isViewerFollowing: false,
    });
  });

  it("hasMoreはoffset+件数がtotalCount未満のときtrueになること", async () => {
    dbHolder.current = createFollowListDbSpy(
      { total: 5 },
      [{ userId: "u1", isPublic: 1, isViewerFollowing: 0 }],
    );

    const result = await followsRepo.getFollowList({
      targetUserId: "target-1",
      type: "following",
      version: "33",
      page: 1,
      limit: 1,
    });

    expect(result.hasMore).toBe(true);
  });
});
