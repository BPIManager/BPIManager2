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

const { userDiscoveryRepo } = await import(
  "@/lib/db/aggregates/userProfiles/discovery"
);

describe("userDiscoveryRepo.getRecommendedUsers", () => {
  it("order='supporters'の場合、自分自身の除外whereをスキップしrole絞り込みを行うこと", async () => {
    const spy = createDbSpy([]);
    dbHolder.current = spy;
    await userDiscoveryRepo.getRecommendedUsers({
      viewerId: "user-1",
      viewerValue: 30,
      version: "33",
      limit: 20,
      offset: 0,
      order: "supporters",
    });
    const whereCalls = callsFor(spy.calls, "where");
    expect(whereCalls.some((c) => c.args[0] === "u.userId")).toBe(false);
  });

  it("order未指定の場合、自分自身を除外すること", async () => {
    const spy = createDbSpy([]);
    dbHolder.current = spy;
    await userDiscoveryRepo.getRecommendedUsers({
      viewerId: "user-1",
      viewerValue: 30,
      version: "33",
      limit: 20,
      offset: 0,
    });
    const whereCalls = callsFor(spy.calls, "where");
    expect(
      whereCalls.some(
        (c) => c.args[0] === "u.userId" && c.args[1] === "!=",
      ),
    ).toBe(true);
  });

  it("limit/offsetが適用されること", async () => {
    const spy = createDbSpy([]);
    dbHolder.current = spy;
    await userDiscoveryRepo.getRecommendedUsers({
      viewerId: "user-1",
      viewerValue: 30,
      version: "33",
      limit: 15,
      offset: 5,
    });
    expect(callsFor(spy.calls, "limit")[0].args).toEqual([15]);
    expect(callsFor(spy.calls, "offset")[0].args).toEqual([5]);
  });
});
