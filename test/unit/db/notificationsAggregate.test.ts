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

const { notificationsAggregateRepo } = await import(
  "@/lib/db/aggregates/notifications"
);

describe("notificationsAggregateRepo.getUnreadCount", () => {
  it("フォロー通知数・追い抜き通知数・承認待ちリクエスト数・承認通知数の合計を返すこと", async () => {
    dbHolder.current = createDbSpy({ cnt: 3 });
    const result = await notificationsAggregateRepo.getUnreadCount(
      "user-1",
      "33",
    );
    // executeTakeFirstは常に同じcanned値を返すため followCount=3, overtakenCount=3,
    // pendingRequestCount=3, unapprovedFollowerCount=3, unreadApprovalCount=3 の合計15
    expect(result).toEqual({ total: 15 });
  });

  it("結果がすべてundefinedの場合0を返すこと", async () => {
    dbHolder.current = createDbSpy(undefined);
    const result = await notificationsAggregateRepo.getUnreadCount(
      "user-1",
      "33",
    );
    expect(result).toEqual({ total: 0 });
  });

  it("追い抜き通知の集計でフォロー対象のusersを結合し公開/承認ガードを効かせること(#295 非公開・未承認フォロー対象のスコア漏洩の回帰防止)", async () => {
    dbHolder.current = createDbSpy({ cnt: 0 });
    await notificationsAggregateRepo.getUnreadCount("user-1", "33");

    const joinCalls = callsFor(dbHolder.current.calls, "innerJoin");
    expect(
      joinCalls.some(
        (c) =>
          c.args[0] === "users as fu" &&
          c.args[1] === "fu.userId" &&
          c.args[2] === "f.followingId",
      ),
    ).toBe(true);
  });
});

describe("notificationsAggregateRepo.getNotifications", () => {
  it("type='all'の場合、follow/overtaken/followApprovedをunionAllすること", async () => {
    dbHolder.current = createDbSpy([]);
    await notificationsAggregateRepo.getNotifications({
      userId: "user-1",
      type: "all",
      latestVersion: "33",
      limit: 20,
      offset: 0,
    });
    // 3種類をunionAllで連結するため呼び出しは2回(chain: follow.unionAll(overtaken).unionAll(approved))
    expect(callsFor(dbHolder.current.calls, "unionAll")).toHaveLength(2);
  });

  it("type='follow'の場合、unionAllは呼ばれないこと", async () => {
    dbHolder.current = createDbSpy([]);
    await notificationsAggregateRepo.getNotifications({
      userId: "user-1",
      type: "follow",
      latestVersion: "33",
      limit: 20,
      offset: 0,
    });
    expect(callsFor(dbHolder.current.calls, "unionAll")).toHaveLength(0);
  });

  it("追い抜き通知でフォロー対象のusersを結合し(公開/承認ガード)、s2.userId起点の重複join(users as u)を張らないこと(#295)", async () => {
    dbHolder.current = createDbSpy([]);
    await notificationsAggregateRepo.getNotifications({
      userId: "user-1",
      type: "overtaken",
      latestVersion: "33",
      limit: 20,
      offset: 0,
    });

    const joinCalls = callsFor(dbHolder.current.calls, "innerJoin");
    expect(
      joinCalls.some(
        (c) => c.args[0] === "users as fu" && c.args[2] === "f.followingId",
      ),
    ).toBe(true);
    // base query の fu と重複する s2.userId 起点の users 結合は張らない
    expect(
      joinCalls.some(
        (c) => c.args[0] === "users as u" && c.args[1] === "s2.userId",
      ),
    ).toBe(false);
  });

  it("limit/offsetが適用されること", async () => {
    dbHolder.current = createDbSpy([]);
    await notificationsAggregateRepo.getNotifications({
      userId: "user-1",
      type: "overtaken",
      latestVersion: "33",
      limit: 10,
      offset: 20,
    });
    expect(callsFor(dbHolder.current.calls, "limit")[0].args).toEqual([10]);
    expect(callsFor(dbHolder.current.calls, "offset")[0].args).toEqual([20]);
  });
});
