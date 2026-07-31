import { describe, it, expect, vi } from "vitest";

const { dbHolder } = vi.hoisted(() => ({
  dbHolder: { current: null as unknown },
}));

vi.mock("@/lib/db", () => ({
  get db() {
    return (dbHolder.current as { db: unknown }).db;
  },
}));

const { followListAggregateRepo } = await import(
  "@/lib/db/aggregates/followList"
);

describe("followListAggregateRepo.getFollowList", () => {
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

    const result = await followListAggregateRepo.getFollowList({
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

    const result = await followListAggregateRepo.getFollowList({
      targetUserId: "target-1",
      type: "following",
      version: "33",
      page: 1,
      limit: 1,
    });

    expect(result.hasMore).toBe(true);
  });
});
