import { describe, it, expect, vi } from "vitest";
import { createDbSpy, callsFor } from "./helpers/dbQuerySpy";

const { dbHolder } = vi.hoisted(() => ({
  dbHolder: { current: null as ReturnType<typeof import("./helpers/dbQuerySpy")["createDbSpy"]> | null },
}));

vi.mock("@/lib/db", () => ({
  get db() {
    return dbHolder.current!.db;
  },
}));

const { apiKeysRepo } = await import("@/lib/db/apiKeys");

describe("apiKeysRepo.findByKey", () => {
  it("keyでapiKeysテーブルを検索すること", async () => {
    const row = { userId: "user-1", key: "secret-key" };
    dbHolder.current = createDbSpy(row);

    const result = await apiKeysRepo.findByKey("secret-key");

    expect(result).toEqual(row);
    expect(callsFor(dbHolder.current.calls, "selectFrom")[0].args).toEqual([
      "apiKeys",
    ]);
    expect(callsFor(dbHolder.current.calls, "where")[0].args).toEqual([
      "key",
      "=",
      "secret-key",
    ]);
  });
});

describe("apiKeysRepo.findByUserId", () => {
  it("userIdでapiKeysテーブルを検索すること", async () => {
    dbHolder.current = createDbSpy({ key: "secret-key" });

    const result = await apiKeysRepo.findByUserId("user-1");

    expect(result).toEqual({ key: "secret-key" });
    expect(callsFor(dbHolder.current.calls, "where")[0].args).toEqual([
      "userId",
      "=",
      "user-1",
    ]);
  });
});

describe("apiKeysRepo.upsert", () => {
  it("重複時はkeyを更新するupsertを実行すること", async () => {
    dbHolder.current = createDbSpy(undefined);

    await apiKeysRepo.upsert("user-1", "new-key");

    expect(callsFor(dbHolder.current.calls, "insertInto")[0].args).toEqual([
      "apiKeys",
    ]);
    const valuesCall = callsFor(dbHolder.current.calls, "values")[0];
    expect(valuesCall.args[0]).toMatchObject({
      userId: "user-1",
      key: "new-key",
    });
    expect(
      callsFor(dbHolder.current.calls, "onDuplicateKeyUpdate")[0].args,
    ).toEqual([{ key: "new-key" }]);
  });
});
