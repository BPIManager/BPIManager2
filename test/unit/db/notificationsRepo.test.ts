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

const { notificationsRepo } = await import("@/lib/db/domains/notifications");

describe("notificationsRepo.getLastReadAt", () => {
  it("lastReadAtを返すこと", async () => {
    const lastReadAt = new Date("2025-01-01");
    dbHolder.current = createDbSpy({ lastReadAt });
    const result = await notificationsRepo.getLastReadAt("user-1");
    expect(result).toEqual(lastReadAt);
  });

  it("レコードが存在しない場合undefinedを返すこと", async () => {
    dbHolder.current = createDbSpy(undefined);
    const result = await notificationsRepo.getLastReadAt("user-1");
    expect(result).toBeUndefined();
  });
});

describe("notificationsRepo.updateLastRead", () => {
  it("lastReadAtを現在時刻でupsertすること", async () => {
    dbHolder.current = createDbSpy(undefined);
    await notificationsRepo.updateLastRead("user-1");
    expect(callsFor(dbHolder.current.calls, "insertInto")[0].args).toEqual([
      "notifications",
    ]);
    expect(
      callsFor(dbHolder.current.calls, "onDuplicateKeyUpdate"),
    ).toHaveLength(1);
  });
});
