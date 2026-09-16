import { describe, it, expect, vi } from "vitest";
import { createTransactionalDbSpy, callsFor } from "../helpers/dbQuerySpy";
import { getManualBatchPrefix } from "@/lib/scores/manualBatchId";

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

  it("logsの現在最新batchIdが今日の手動プレフィックスと一致する場合、そのbatchIdをそのまま使い回すこと", async () => {
    const prefix = getManualBatchPrefix("user-1", "34");
    const spy = createTransactionalDbSpy(undefined, { batchId: prefix });
    dbHolder.current = spy;

    const { batchId } = await saveManualScoreUpdate({
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

    expect(batchId).toBe(prefix);
  });

  it("logsの現在最新batchIdが今日の手動プレフィックスと不一致（CSVインポート等が割り込んだ）の場合、重複を避けて新しいbatchIdを発行すること", async () => {
    const prefix = getManualBatchPrefix("user-1", "34");
    // CSVインポート由来のランダムUUID風batchId(今日の手動プレフィックスとは無関係)
    const spy = createTransactionalDbSpy(undefined, {
      batchId: "29661a97-0f8f-435b-ac31-980864e35687",
    });
    dbHolder.current = spy;

    const { batchId } = await saveManualScoreUpdate({
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

    // プレフィックスは維持しつつ、bareなプレフィックス自体（既にlogsで使用済みの
    // 可能性がある値）とは異なる新規IDが発行される（logs.batchIdのUNIQUE制約と
    // の重複を避けるため）
    expect(batchId.startsWith(prefix)).toBe(true);
    expect(batchId).not.toBe(prefix);
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
