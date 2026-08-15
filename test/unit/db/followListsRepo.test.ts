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

const { followListsRepo } = await import("@/lib/db/domains/followLists");

describe("followListsRepo.create", () => {
  it("insertした行のIDを数値で返すこと", async () => {
    const spy = createDbSpy({ insertId: 5 });
    dbHolder.current = spy;

    const id = await followListsRepo.create("user-1", "強豪", true);

    expect(id).toBe(5);
    expect(callsFor(spy.calls, "insertInto")[0].args).toEqual(["followLists"]);
    expect(callsFor(spy.calls, "values")[0].args).toEqual([
      { userId: "user-1", name: "強豪", isPublic: 1 },
    ]);
  });
});

describe("followListsRepo.update", () => {
  it("所有者一致で更新できた場合trueを返すこと", async () => {
    const spy = createDbSpy({ numUpdatedRows: 1 });
    dbHolder.current = spy;

    const result = await followListsRepo.update(1, "user-1", {
      name: "新しい名前",
    });

    expect(result).toBe(true);
    expect(callsFor(spy.calls, "updateTable")[0].args).toEqual([
      "followLists",
    ]);
    const whereCalls = callsFor(spy.calls, "where");
    expect(whereCalls[0].args).toEqual(["id", "=", 1]);
    expect(whereCalls[1].args).toEqual(["userId", "=", "user-1"]);
  });

  it("対象が存在しない場合falseを返すこと", async () => {
    const spy = createDbSpy({ numUpdatedRows: 0 });
    dbHolder.current = spy;

    expect(await followListsRepo.update(1, "user-1", { name: "x" })).toBe(
      false,
    );
  });

  it("isPublicを1/0に変換して更新すること", async () => {
    const spy = createDbSpy({ numUpdatedRows: 1 });
    dbHolder.current = spy;

    await followListsRepo.update(1, "user-1", { isPublic: true });

    expect(callsFor(spy.calls, "set")[0].args).toEqual([{ isPublic: 1 }]);
  });

  it("name/isPublic両方を指定すると1回のUPDATEにまとめること", async () => {
    const spy = createDbSpy({ numUpdatedRows: 1 });
    dbHolder.current = spy;

    await followListsRepo.update(1, "user-1", {
      name: "新しい名前",
      isPublic: false,
    });

    expect(callsFor(spy.calls, "updateTable")).toHaveLength(1);
    expect(callsFor(spy.calls, "set")[0].args).toEqual([
      { name: "新しい名前", isPublic: 0 },
    ]);
  });
});

describe("followListsRepo.remove", () => {
  it("所有者一致で削除できた場合trueを返すこと", async () => {
    const spy = createDbSpy({ numDeletedRows: 1 });
    dbHolder.current = spy;

    expect(await followListsRepo.remove(1, "user-1")).toBe(true);
    expect(callsFor(spy.calls, "deleteFrom")[0].args).toEqual([
      "followLists",
    ]);
  });

  it("所有者が一致しない場合falseを返すこと", async () => {
    const spy = createDbSpy({ numDeletedRows: 0 });
    dbHolder.current = spy;

    expect(await followListsRepo.remove(1, "other-user")).toBe(false);
  });
});
