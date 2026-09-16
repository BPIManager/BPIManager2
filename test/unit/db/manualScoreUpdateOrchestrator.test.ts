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

const { saveManualScoreUpdate } = await import(
  "@/lib/db/orchestrators/manualScoreUpdate"
);

describe("manualScoreUpdateOrchestrator.saveManualScoreUpdate", () => {
  it("scores.batchIdはlogs.batchIdへの外部キーのため、logs/userStatusLogsをscoresより先にinsertすること", async () => {
    const spy = createTransactionalDbSpy(undefined);
    dbHolder.current = spy;

    await saveManualScoreUpdate({
      userId: "user-1",
      version: "34",
      score: {
        songId: 1,
        definitionId: 10,
        exScore: 900,
        bpi: 50,
        clearState: "HARD",
        missCount: 0,
      },
      newTotalBpi: 50,
    });

    const insertCalls = callsFor(spy.calls, "insertInto").map((c) => c.args[0]);
    const logsIndex = insertCalls.indexOf("logs");
    const scoresIndex = insertCalls.indexOf("scores");

    expect(logsIndex).toBeGreaterThanOrEqual(0);
    expect(scoresIndex).toBeGreaterThanOrEqual(0);
    expect(logsIndex).toBeLessThan(scoresIndex);
  });

  it("allScoreのみ（☆10以下）の場合、logs/userStatusLogs/scoresは一切書き込まないこと", async () => {
    const spy = createTransactionalDbSpy(undefined);
    dbHolder.current = spy;

    const { totalBpi } = await saveManualScoreUpdate({
      userId: "user-1",
      version: "34",
      allScore: {
        songId: 900,
        exScore: 200,
        bpi: null,
        clearState: "EASY",
        missCount: 1,
      },
    });

    expect(totalBpi).toBeNull();
    const insertCalls = callsFor(spy.calls, "insertInto").map((c) => c.args[0]);
    expect(insertCalls).toEqual(["allScores"]);
  });
});
