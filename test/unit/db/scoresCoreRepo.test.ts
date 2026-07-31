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

const { scoresRepo } = await import("@/lib/db/scores");

describe("scoresRepo.getLatestScores", () => {
  it("scoresテーブルから最新スコアを取得すること", async () => {
    dbHolder.current = createDbSpy([]);
    await scoresRepo.getLatestScores("user-1", "33");
    expect(callsFor(dbHolder.current.calls, "selectFrom")[0].args).toEqual([
      "scores",
    ]);
  });
});

describe("scoresRepo.getSongBpimRank", () => {
  it("above件数+1をrankとして返すこと", async () => {
    dbHolder.current = createDbSpy({ total: 100, above: 4 });
    const result = await scoresRepo.getSongBpimRank(1, 1800);
    expect(result).toEqual({ rank: 5, total: 100 });
  });

  it("結果がundefinedの場合rank=1, total=0を返すこと", async () => {
    dbHolder.current = createDbSpy(undefined);
    const result = await scoresRepo.getSongBpimRank(1, 1800);
    expect(result).toEqual({ rank: 1, total: 0 });
  });
});
