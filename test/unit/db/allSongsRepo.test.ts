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

const { allSongsRepo } = await import("@/lib/db/allSongs");

describe("allSongsRepo.getAllLevelMaster", () => {
  it("allSongsテーブルから全難易度の楽曲マスタを取得すること", async () => {
    const rows = [{ songId: 1, title: "冥" }];
    dbHolder.current = createDbSpy(rows);

    const result = await allSongsRepo.getAllLevelMaster();

    expect(result).toEqual(rows);
    expect(callsFor(dbHolder.current.calls, "selectFrom")[0].args).toEqual([
      "allSongs",
    ]);
  });
});
