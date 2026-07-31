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

const { usersRepo } = await import("@/lib/db/domains/users");

describe("usersRepo.checkUserNameAvailability", () => {
  it("userNameで検索すること", async () => {
    dbHolder.current = createDbSpy({ userId: "user-1" });
    const result = await usersRepo.checkUserNameAvailability("taken-name");
    expect(result).toEqual({ userId: "user-1" });
  });
});

describe("usersRepo.upsertUserProfile", () => {
  it("同名かつ別ユーザーが存在する場合409エラーを投げること", async () => {
    const spy = createTransactionalDbSpy({ userId: "other-user" });
    dbHolder.current = spy;

    await expect(
      usersRepo.upsertUserProfile({
        userId: "user-1",
        userName: "重複名",
        iidxId: null,
        profileText: null,
        profileImage: null,
        isPublic: 1,
        xId: null,
        version: "33",
        batchId: "batch-1",
      }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("重複がない場合、users/userStatusLogsへ書き込み成功を返すこと", async () => {
    const spy = createTransactionalDbSpy(undefined);
    dbHolder.current = spy;

    const result = await usersRepo.upsertUserProfile({
      userId: "user-1",
      userName: "新規名",
      iidxId: null,
      profileText: null,
      profileImage: null,
      isPublic: 1,
      xId: null,
      version: "33",
      batchId: "batch-1",
    });

    expect(result).toEqual({ success: true });
    expect(callsFor(spy.calls, "insertInto").map((c) => c.args[0])).toEqual([
      "users",
      "userStatusLogs",
    ]);
  });
});
