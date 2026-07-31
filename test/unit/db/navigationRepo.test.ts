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

const { navigationRepo } = await import("@/lib/db/logs/navigation");

describe("navigationRepo.getLatestTotalBpi", () => {
  it("userId/versionで絞り込み最新1件を取得すること", async () => {
    dbHolder.current = createDbSpy({ totalBpi: 30 });
    const result = await navigationRepo.getLatestTotalBpi("user-1", "33");
    expect(result).toEqual({ totalBpi: 30 });
    expect(callsFor(dbHolder.current.calls, "limit")[0].args).toEqual([1]);
    expect(callsFor(dbHolder.current.calls, "orderBy")[0].args).toEqual([
      "id",
      "desc",
    ]);
  });
});
