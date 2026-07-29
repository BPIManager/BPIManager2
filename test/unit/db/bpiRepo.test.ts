import { describe, it, expect, vi } from "vitest";
import {
  createDbSpy,
  createTransactionalDbSpy,
  callsFor,
} from "../helpers/dbQuerySpy";

const { dbHolder } = vi.hoisted(() => ({
  dbHolder: {
    current: null as
      | ReturnType<typeof import("../helpers/dbQuerySpy")["createDbSpy"]>
      | ReturnType<
          typeof import("../helpers/dbQuerySpy")["createTransactionalDbSpy"]
        >
      | null,
  },
}));

vi.mock("@/lib/db", () => ({
  get db() {
    return dbHolder.current!.db;
  },
}));

const { bpiRepo } = await import("@/lib/db/bpi");

describe("bpiRepo.getSongMasterWithDef", () => {
  it("songsとsongDefを結合したクエリを実行し結果を返すこと", async () => {
    const rows = [{ songId: 1, title: "冥" }];
    dbHolder.current = createDbSpy(rows);

    const result = await bpiRepo.getSongMasterWithDef();

    expect(result).toEqual(rows);
    expect(callsFor(dbHolder.current.calls, "selectFrom")[0].args).toEqual([
      "songs as s",
    ]);
  });
});

describe("bpiRepo.getLatestScores / getLatestAllScores", () => {
  it("scoresテーブルから最新スコアを取得すること", async () => {
    dbHolder.current = createDbSpy([]);
    await bpiRepo.getLatestScores("user-1", "33");
    expect(callsFor(dbHolder.current.calls, "selectFrom")[0].args).toEqual([
      "scores",
    ]);
  });

  it("allScoresテーブルから最新スコアを取得すること", async () => {
    dbHolder.current = createDbSpy([]);
    await bpiRepo.getLatestAllScores("user-1", "33");
    expect(callsFor(dbHolder.current.calls, "selectFrom")[0].args).toEqual([
      "allScores",
    ]);
  });
});

describe("bpiRepo.getLatestTotalBpi", () => {
  it("userId/versionで絞り込み最新1件を取得すること", async () => {
    dbHolder.current = createDbSpy({ totalBpi: 30 });
    const result = await bpiRepo.getLatestTotalBpi("user-1", "33");
    expect(result).toEqual({ totalBpi: 30 });
    expect(callsFor(dbHolder.current.calls, "limit")[0].args).toEqual([1]);
    expect(callsFor(dbHolder.current.calls, "orderBy")[0].args).toEqual([
      "id",
      "desc",
    ]);
  });
});

describe("bpiRepo.getSongWithDefByTitleDifficulty", () => {
  it("title/difficultyで楽曲を検索すること", async () => {
    dbHolder.current = createDbSpy({ songId: 1 });
    const result = await bpiRepo.getSongWithDefByTitleDifficulty(
      "冥",
      "ANOTHER",
    );
    expect(result).toEqual({ songId: 1 });
    const whereCalls = callsFor(dbHolder.current.calls, "where");
    expect(whereCalls[0].args).toEqual(["s.title", "=", "冥"]);
    expect(whereCalls[1].args).toEqual(["s.difficulty", "=", "ANOTHER"]);
  });
});

describe("bpiRepo.getSongBpimRank", () => {
  it("above件数+1をrankとして返すこと", async () => {
    dbHolder.current = createDbSpy({ total: 100, above: 4 });
    const result = await bpiRepo.getSongBpimRank(1, 1800);
    expect(result).toEqual({ rank: 5, total: 100 });
  });

  it("結果がundefinedの場合rank=1, total=0を返すこと", async () => {
    dbHolder.current = createDbSpy(undefined);
    const result = await bpiRepo.getSongBpimRank(1, 1800);
    expect(result).toEqual({ rank: 1, total: 0 });
  });
});

describe("bpiRepo.saveImportResults", () => {
  it("scoreUpdatesがある場合、logs/userStatusLogs/scoresへ書き込むこと", async () => {
    const spy = createTransactionalDbSpy({ arenaRank: 5 });
    dbHolder.current = spy;

    await bpiRepo.saveImportResults({
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

    await bpiRepo.saveImportResults({
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

    await bpiRepo.saveImportResults({
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

describe("bpiRepo.importFromBPIM", () => {
  it("常にscores/logs/userStatusLogsを削除すること", async () => {
    const spy = createTransactionalDbSpy(undefined);
    dbHolder.current = spy;

    await bpiRepo.importFromBPIM({
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

    await bpiRepo.importFromBPIM({
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

    await bpiRepo.importFromBPIM({
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
