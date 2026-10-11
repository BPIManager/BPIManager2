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

const { followApprovalNotificationsRepo } = await import(
  "@/lib/db/domains/followApprovalNotifications"
);

describe("followApprovalNotificationsRepo.existsForPair", () => {
  it("該当する組み合わせのレコードが存在すればtrueを返すこと", async () => {
    const spy = createDbSpy({ id: 1 });
    dbHolder.current = spy;

    const result = await followApprovalNotificationsRepo.existsForPair(
      "recipient-1",
      "actor-1",
    );

    expect(result).toBe(true);
    const whereCalls = callsFor(spy.calls, "where");
    expect(whereCalls[0].args).toEqual(["recipientId", "=", "recipient-1"]);
    expect(whereCalls[1].args).toEqual(["actorId", "=", "actor-1"]);
  });

  it("レコードが存在しなければfalseを返すこと", async () => {
    const spy = createDbSpy(undefined);
    dbHolder.current = spy;

    expect(
      await followApprovalNotificationsRepo.existsForPair(
        "recipient-1",
        "actor-1",
      ),
    ).toBe(false);
  });
});

describe("followApprovalNotificationsRepo.recordApproval", () => {
  it("recipientId/actorIdでfollowApprovalNotificationsに挿入すること", async () => {
    const spy = createDbSpy(undefined);
    dbHolder.current = spy;

    await followApprovalNotificationsRepo.recordApproval(
      "recipient-1",
      "actor-1",
    );

    expect(callsFor(spy.calls, "insertInto")[0].args).toEqual([
      "followApprovalNotifications",
    ]);
    expect(callsFor(spy.calls, "values")[0].args).toEqual([
      { recipientId: "recipient-1", actorId: "actor-1" },
    ]);
  });
});

describe("followApprovalNotificationsRepo.deleteForPair", () => {
  it("recipientId/actorIdの組に一致する承認記録を全行削除し、削除行数を返すこと", async () => {
    const spy = createDbSpy({ numDeletedRows: BigInt(2) });
    dbHolder.current = spy;

    const deleted = await followApprovalNotificationsRepo.deleteForPair(
      spy.db as never,
      "recipient-1",
      "actor-1",
    );

    expect(deleted).toBe(2);
    expect(callsFor(spy.calls, "deleteFrom")[0].args).toEqual([
      "followApprovalNotifications",
    ]);
    const whereCalls = callsFor(spy.calls, "where");
    expect(whereCalls[0].args).toEqual(["recipientId", "=", "recipient-1"]);
    expect(whereCalls[1].args).toEqual(["actorId", "=", "actor-1"]);
  });
});
