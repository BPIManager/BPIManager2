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
  it("フォロー通知数と追い抜き通知数の合計を返すこと", async () => {
    dbHolder.current = createDbSpy({ cnt: 3 });
    const result = await notificationsAggregateRepo.getUnreadCount(
      "user-1",
      "33",
    );
    // executeTakeFirstは常に同じcanned値を返すため followCount=3, overtakenCount=3
    expect(result).toEqual({ total: 6 });
  });

  it("結果がすべてundefinedの場合0を返すこと", async () => {
    dbHolder.current = createDbSpy(undefined);
    const result = await notificationsAggregateRepo.getUnreadCount(
      "user-1",
      "33",
    );
    expect(result).toEqual({ total: 0 });
  });
});

describe("notificationsAggregateRepo.getNotifications", () => {
  it("type='all'の場合、follow/overtakenをunionAllすること", async () => {
    dbHolder.current = createDbSpy([]);
    await notificationsAggregateRepo.getNotifications({
      userId: "user-1",
      type: "all",
      latestVersion: "33",
      limit: 20,
      offset: 0,
    });
    expect(callsFor(dbHolder.current.calls, "unionAll")).toHaveLength(1);
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
