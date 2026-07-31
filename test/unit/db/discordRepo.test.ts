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

const { discordLinksRepo } = await import("@/lib/db/domains/discord");

describe("discordLinksRepo.findByDiscordUserId", () => {
  it("discordUserIdでdiscordLinksを検索すること", async () => {
    const row = { discordUserId: "d1", userId: "user-1" };
    dbHolder.current = createDbSpy(row);
    const result = await discordLinksRepo.findByDiscordUserId("d1");
    expect(result).toEqual(row);
    expect(callsFor(dbHolder.current.calls, "where")[0].args).toEqual([
      "discordUserId",
      "=",
      "d1",
    ]);
  });
});

describe("discordLinksRepo.upsert", () => {
  it("discordUserId/userIdでupsertすること", async () => {
    dbHolder.current = createDbSpy(undefined);
    await discordLinksRepo.upsert("d1", "user-1");
    expect(callsFor(dbHolder.current.calls, "insertInto")[0].args).toEqual([
      "discordLinks",
    ]);
    expect(
      callsFor(dbHolder.current.calls, "onDuplicateKeyUpdate")[0].args,
    ).toEqual([{ userId: "user-1" }]);
  });
});

describe("discordLinksRepo.deleteByDiscordUserId", () => {
  it("discordUserIdでdiscordLinksを削除すること", async () => {
    dbHolder.current = createDbSpy(undefined);
    await discordLinksRepo.deleteByDiscordUserId("d1");
    expect(callsFor(dbHolder.current.calls, "deleteFrom")[0].args).toEqual([
      "discordLinks",
    ]);
    expect(callsFor(dbHolder.current.calls, "where")[0].args).toEqual([
      "discordUserId",
      "=",
      "d1",
    ]);
  });
});

describe("discordLinksRepo.upsertUserRole", () => {
  it("userId/roleでuserRolesをupsertすること", async () => {
    dbHolder.current = createDbSpy(undefined);
    await discordLinksRepo.upsertUserRole("user-1", "iidx");
    expect(
      callsFor(dbHolder.current.calls, "onDuplicateKeyUpdate")[0].args,
    ).toEqual([{ role: "iidx" }]);
  });
});

describe("discordLinksRepo.deleteDiscordUserRole", () => {
  it("Discord管理対象ロール(coffee/saba/iidx)のみを削除対象とすること", async () => {
    dbHolder.current = createDbSpy(undefined);
    await discordLinksRepo.deleteDiscordUserRole("user-1");
    const whereCalls = callsFor(dbHolder.current.calls, "where");
    expect(whereCalls[1].args).toEqual([
      "role",
      "in",
      ["coffee", "saba", "iidx"],
    ]);
  });
});

describe("discordLinksRepo.getUserRole / userExists", () => {
  it("getUserRoleはuserRolesからroleを取得すること", async () => {
    dbHolder.current = createDbSpy({ role: "iidx" });
    const result = await discordLinksRepo.getUserRole("user-1");
    expect(result).toEqual({ role: "iidx" });
  });

  it("userExistsはusersテーブルの存在確認を行うこと", async () => {
    dbHolder.current = createDbSpy({ userId: "user-1" });
    const result = await discordLinksRepo.userExists("user-1");
    expect(result).toEqual({ userId: "user-1" });
    expect(callsFor(dbHolder.current.calls, "selectFrom")[0].args).toEqual([
      "users",
    ]);
  });
});
