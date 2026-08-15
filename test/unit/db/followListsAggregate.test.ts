import { describe, it, expect, vi } from "vitest";
import { createDbSpy } from "../helpers/dbQuerySpy";

const { dbHolder } = vi.hoisted(() => ({
  dbHolder: { current: null as unknown },
}));

vi.mock("@/lib/db", () => ({
  get db() {
    return (dbHolder.current as { db: unknown }).db;
  },
}));

const { followListsAggregateRepo } = await import(
  "@/lib/db/aggregates/followLists"
);

describe("followListsAggregateRepo.getListsWithMemberCount", () => {
  it("isPublicをboolean化し、memberCountを数値化して返すこと", async () => {
    const spy = createDbSpy([
      { id: 1, name: "強豪", isPublic: 1, createdAt: "2026-01-01", memberCount: "3" },
      { id: 2, name: "後輩", isPublic: 0, createdAt: "2026-01-02", memberCount: "0" },
    ]);
    dbHolder.current = spy;

    const result = await followListsAggregateRepo.getListsWithMemberCount(
      "user-1",
    );

    expect(result).toEqual([
      { id: 1, name: "強豪", isPublic: true, createdAt: "2026-01-01", memberCount: 3 },
      { id: 2, name: "後輩", isPublic: false, createdAt: "2026-01-02", memberCount: 0 },
    ]);
  });
});

describe("followListsAggregateRepo.getFollowingWithListMembership", () => {
  it("同一ユーザーの複数リスト所属を1エントリのlistIds配列にまとめること", async () => {
    const spy = createDbSpy([
      { userId: "u1", userName: "Alice", profileImage: null, listId: 10 },
      { userId: "u1", userName: "Alice", profileImage: null, listId: 20 },
      { userId: "u2", userName: "Bob", profileImage: "img.png", listId: null },
    ]);
    dbHolder.current = spy;

    const result = await followListsAggregateRepo.getFollowingWithListMembership(
      "viewer-1",
    );

    expect(result).toEqual([
      { userId: "u1", userName: "Alice", profileImage: null, listIds: [10, 20] },
      { userId: "u2", userName: "Bob", profileImage: "img.png", listIds: [] },
    ]);
  });
});
