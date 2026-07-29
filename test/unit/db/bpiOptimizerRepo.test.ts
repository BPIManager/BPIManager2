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

const { bpiOptimizerRepo } = await import("@/lib/db/bpi-optimizer");

describe("bpiOptimizerRepo.getAllSongsWithUserScores", () => {
  it("INF以外のバージョンでは$ifにtrueを渡してreleasedVersion等の条件を適用すること", async () => {
    dbHolder.current = createDbSpy([]);
    await bpiOptimizerRepo.getAllSongsWithUserScores("user-1", "33");
    const ifCalls = callsFor(dbHolder.current.calls, "$if");
    expect(ifCalls[0].args[0]).toBe(true);
  });

  it("INFバージョンでは$ifにfalseを渡すこと", async () => {
    dbHolder.current = createDbSpy([]);
    await bpiOptimizerRepo.getAllSongsWithUserScores("user-1", "INF");
    const ifCalls = callsFor(dbHolder.current.calls, "$if");
    expect(ifCalls[0].args[0]).toBe(false);
  });

  it("difficultyLevel=12・対象難易度のみに絞り込むこと", async () => {
    dbHolder.current = createDbSpy([]);
    await bpiOptimizerRepo.getAllSongsWithUserScores("user-1", "33");
    const whereCalls = callsFor(dbHolder.current.calls, "where");
    expect(whereCalls).toContainEqual({
      method: "where",
      args: ["m.difficultyLevel", "=", 12],
    });
  });
});

describe("bpiOptimizerRepo.saveMemo", () => {
  it("reportDataをJSON文字列化してinsertし、reportIdを返すこと", async () => {
    dbHolder.current = createDbSpy(undefined);

    const reportId = await bpiOptimizerRepo.saveMemo("user-1", 30, {
      steps: [],
      currentTotalBpi: 20,
      targetTotalBpi: 30,
      achievable: true,
      alreadyAchieved: false,
      totalSongCount: 100,
    });

    expect(typeof reportId).toBe("string");
    const valuesCall = callsFor(dbHolder.current.calls, "values")[0];
    const values = valuesCall.args[0] as { reportData: string; userId: string };
    expect(values.userId).toBe("user-1");
    expect(JSON.parse(values.reportData)).toMatchObject({ targetTotalBpi: 30 });
  });
});

describe("bpiOptimizerRepo.getMemosByUserId", () => {
  it("reportDataをパースしたオブジェクトとして返すこと", async () => {
    dbHolder.current = createDbSpy([
      {
        reportId: "r1",
        targetBpi: 30,
        reportData: JSON.stringify({ achievable: true }),
        createdAt: "2025-01-01",
      },
    ]);

    const result = await bpiOptimizerRepo.getMemosByUserId("user-1");

    expect(result[0].reportData).toEqual({ achievable: true });
  });

  it("作成日時の降順でソートすること", async () => {
    dbHolder.current = createDbSpy([]);
    await bpiOptimizerRepo.getMemosByUserId("user-1");
    expect(callsFor(dbHolder.current.calls, "orderBy")[0].args).toEqual([
      "createdAt",
      "desc",
    ]);
  });
});

describe("bpiOptimizerRepo.deleteMemo", () => {
  it("削除件数が1件以上ならtrueを返すこと", async () => {
    dbHolder.current = createDbSpy({ numDeletedRows: 1n });
    const result = await bpiOptimizerRepo.deleteMemo("user-1", "r1");
    expect(result).toBe(true);
  });

  it("削除件数が0件ならfalseを返すこと", async () => {
    dbHolder.current = createDbSpy({ numDeletedRows: 0n });
    const result = await bpiOptimizerRepo.deleteMemo("user-1", "r1");
    expect(result).toBe(false);
  });
});
