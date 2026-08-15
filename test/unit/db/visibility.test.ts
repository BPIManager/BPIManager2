import { describe, it, expect } from "vitest";
import { sql } from "kysely";
import { canViewUserData, wherePublicOnly } from "@/lib/db/shared/visibility";
import { createQueryBuilderSpy, callsFor } from "../helpers/dbQuerySpy";

describe("canViewUserData", () => {
  it("公開ユーザーは他人からも見えること", () => {
    expect(
      canViewUserData({
        viewerId: "viewer-1",
        targetUserId: "target-1",
        isPublic: 1,
      }),
    ).toBe(true);
  });

  it("非公開ユーザーは他人からは見えないこと", () => {
    expect(
      canViewUserData({
        viewerId: "viewer-1",
        targetUserId: "target-1",
        isPublic: 0,
      }),
    ).toBe(false);
  });

  it("非公開でも自分自身なら見えること", () => {
    expect(
      canViewUserData({
        viewerId: "user-1",
        targetUserId: "user-1",
        isPublic: 0,
      }),
    ).toBe(true);
  });

  it("公開かつ自分自身でも見えること", () => {
    expect(
      canViewUserData({
        viewerId: "user-1",
        targetUserId: "user-1",
        isPublic: 1,
      }),
    ).toBe(true);
  });

  it("viewerId省略時は自分自身判定を行わずisPublicのみで判定すること(公開)", () => {
    expect(
      canViewUserData({
        targetUserId: "target-1",
        isPublic: 1,
      }),
    ).toBe(true);
  });

  it("viewerId省略時は自分自身判定を行わずisPublicのみで判定すること(非公開)", () => {
    expect(
      canViewUserData({
        targetUserId: "target-1",
        isPublic: 0,
      }),
    ).toBe(false);
  });

  it("isPublicがbooleanのfalseでも非公開として扱うこと", () => {
    expect(
      canViewUserData({
        viewerId: "viewer-1",
        targetUserId: "target-1",
        isPublic: false,
      }),
    ).toBe(false);
  });
});

describe("wherePublicOnly", () => {
  it("isPublic=1のwhere条件を指定したカラムに追加すること", () => {
    const { proxy, calls } = createQueryBuilderSpy([]);
    wherePublicOnly(proxy as never, "u.isPublic");

    const whereCalls = callsFor(calls, "where");
    expect(whereCalls).toHaveLength(1);
    expect(JSON.stringify(whereCalls[0].args[0])).toBe(
      JSON.stringify(sql.ref("u.isPublic")),
    );
    expect(whereCalls[0].args[1]).toBe("=");
    expect(whereCalls[0].args[2]).toBe(1);
  });
});
