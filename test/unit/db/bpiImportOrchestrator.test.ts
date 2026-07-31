import { describe, it, expect, vi } from "vitest";
import { createTransactionalDbSpy, callsFor } from "../helpers/dbQuerySpy";

const { dbHolder } = vi.hoisted(() => ({
  dbHolder: {
    current: null as ReturnType<
      typeof import("../helpers/dbQuerySpy")["createTransactionalDbSpy"]
    > | null,
  },
}));

vi.mock("@/lib/db", () => ({
  get db() {
    return dbHolder.current!.db;
  },
}));

const { saveImportResults, importFromBPIM } = await import(
  "@/lib/db/orchestrators/bpiImport"
);

describe("bpiImportOrchestrator.saveImportResults", () => {
  it("scoreUpdatesがある場合、logs/userStatusLogs/scoresへ書き込むこと", async () => {
    const spy = createTransactionalDbSpy({ arenaRank: 5 });
    dbHolder.current = spy;

    await saveImportResults({
      userId: "user-1",
      version: "33",
      batchId: "batch-1",
      scoreUpdates: [{ songId: 1 } as never],
      allScoreUpdates: [],
      newTotalBpi: 30,
    });

    const insertCalls = callsFor(spy.calls, "insertInto");
    expect(insertCalls.map((c) => c.args[0])).toEqual([
      "logs",
      "userStatusLogs",
      "scores",
    ]);
  });

  it("scoreUpdatesが空の場合、logs系への書き込みをスキップすること", async () => {
    const spy = createTransactionalDbSpy(undefined);
    dbHolder.current = spy;

    await saveImportResults({
      userId: "user-1",
      version: "33",
      batchId: "batch-1",
      scoreUpdates: [],
      allScoreUpdates: [],
      newTotalBpi: 30,
    });

    expect(callsFor(spy.calls, "insertInto")).toHaveLength(0);
  });

  it("allScoreUpdatesを1000件超で複数チャンクに分けてinsertすること", async () => {
    const spy = createTransactionalDbSpy(undefined);
    dbHolder.current = spy;

    const allScoreUpdates = Array.from({ length: 1500 }, (_, i) => ({
      songId: i,
    })) as never[];

    await saveImportResults({
      userId: "user-1",
      version: "33",
      batchId: "batch-1",
      scoreUpdates: [],
      allScoreUpdates,
      newTotalBpi: 30,
    });

    const allScoresInserts = callsFor(spy.calls, "values").filter((c) =>
      Array.isArray(c.args[0]),
    );
    // allScoreUpdatesのみが配列valuesとしてinsertされる(1500件を2チャンクに分割)
    expect(allScoresInserts).toHaveLength(2);
    expect((allScoresInserts[0].args[0] as unknown[]).length).toBe(1000);
    expect((allScoresInserts[1].args[0] as unknown[]).length).toBe(500);
  });
});

describe("bpiImportOrchestrator.importFromBPIM", () => {
  it("常にscores/logs/userStatusLogsを削除すること", async () => {
    const spy = createTransactionalDbSpy(undefined);
    dbHolder.current = spy;

    await importFromBPIM({
      userId: "user-1",
      scoreUpdates: [],
      statusLogs: [],
      finalTotalBpi: -15,
    });

    const deleteCalls = callsFor(spy.calls, "deleteFrom");
    expect(deleteCalls.map((c) => c.args[0])).toEqual([
      "scores",
      "logs",
      "userStatusLogs",
    ]);
    expect(callsFor(spy.calls, "insertInto")).toHaveLength(0);
  });

  it("statusLogs/scoreUpdatesがある場合それぞれinsertすること", async () => {
    const spy = createTransactionalDbSpy(undefined);
    dbHolder.current = spy;

    await importFromBPIM({
      userId: "user-1",
      scoreUpdates: [{ songId: 1 } as never],
      statusLogs: [{ userId: "user-1" } as never],
      finalTotalBpi: 30,
    });

    const insertCalls = callsFor(spy.calls, "insertInto");
    expect(insertCalls.map((c) => c.args[0])).toEqual([
      "userStatusLogs",
      "logs",
      "scores",
    ]);
  });

  it("scoreUpdatesが1000件超の場合複数チャンクでinsertすること", async () => {
    const spy = createTransactionalDbSpy(undefined);
    dbHolder.current = spy;

    const scoreUpdates = Array.from({ length: 2500 }, (_, i) => ({
      songId: i,
    })) as never[];

    await importFromBPIM({
      userId: "user-1",
      scoreUpdates,
      statusLogs: [],
      finalTotalBpi: 30,
    });

    const insertCalls = callsFor(spy.calls, "insertInto").filter(
      (c) => c.args[0] === "scores",
    );
    expect(insertCalls).toHaveLength(3);
  });
});
