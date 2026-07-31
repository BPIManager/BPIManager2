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

const { allScoresAggregateRepo } = await import("@/lib/db/aggregates/allScores");

describe("allScoresAggregateRepo.getAllScoresList", () => {
  it("フィルタなしの場合、ベースのwhere(deletedAt)のみが適用されること", async () => {
    dbHolder.current = createDbSpy([]);
    await allScoresAggregateRepo.getAllScoresList("user-1", {
      search: "",
      levels: "",
      difficulties: "",
      clearStates: "",
      sortKey: "level",
      sortOrder: "desc",
    });
    // ベース1件 + 共有サブクエリ内のuserId絞り込み1件 = 2件
    expect(callsFor(dbHolder.current.calls, "where")).toHaveLength(2);
  });

  it("search/levels/difficulties/clearStatesを指定するとwhere呼び出しが増えること", async () => {
    dbHolder.current = createDbSpy([]);
    await allScoresAggregateRepo.getAllScoresList("user-1", {
      search: "冥",
      levels: "11,12",
      difficulties: "ANOTHER,HYPER",
      clearStates: "CLEAR,HARD CLEAR",
      sortKey: "level",
      sortOrder: "desc",
    });
    // ベース1件 + 共有サブクエリ内のuserId絞り込み1件 + search + levels + difficulties + clearStates = 6件
    expect(callsFor(dbHolder.current.calls, "where")).toHaveLength(6);
  });

  it("sortKeyに応じたorderByカラムが指定されること", async () => {
    dbHolder.current = createDbSpy([]);
    await allScoresAggregateRepo.getAllScoresList("user-1", {
      search: "",
      levels: "",
      difficulties: "",
      clearStates: "",
      sortKey: "exScore",
      sortOrder: "asc",
    });
    const orderByCalls = callsFor(dbHolder.current.calls, "orderBy");
    expect(orderByCalls[orderByCalls.length - 1].args).toEqual([
      "a.exScore",
      "asc",
    ]);
  });

  it("行データをAllSongWithScore形式に変換すること(null合体を含む)", async () => {
    dbHolder.current = createDbSpy([
      {
        songId: 1,
        title: "冥",
        notes: 1000,
        bpm: null,
        difficulty: "ANOTHER",
        difficultyLevel: 12,
        releasedVersion: null,
        logId: 5,
        exScore: 1800,
        clearState: "HARD CLEAR",
        missCount: 5,
        lastPlayed: "2025-01-01",
      },
    ]);
    const results = await allScoresAggregateRepo.getAllScoresList("user-1", {
      search: "",
      levels: "",
      difficulties: "",
      clearStates: "",
      sortKey: "level",
      sortOrder: "desc",
    });
    expect(results).toEqual([
      {
        songId: 1,
        title: "冥",
        notes: 1000,
        bpm: null,
        difficulty: "ANOTHER",
        difficultyLevel: 12,
        releasedVersion: null,
        logId: 5,
        exScore: 1800,
        clearState: "HARD CLEAR",
        missCount: 5,
        lastPlayed: "2025-01-01",
      },
    ]);
  });
});

describe("allScoresAggregateRepo.getRivalScoresForAllSong", () => {
  it("followsとallScoresを結合したクエリを実行し結果をそのまま返すこと", async () => {
    const rows = [{ userId: "rival-1", exScore: 1800 }];
    dbHolder.current = createDbSpy(rows);

    const result = await allScoresAggregateRepo.getRivalScoresForAllSong({
      viewerId: "viewer-1",
      songId: 1,
      version: "33",
    });

    expect(result).toEqual(rows);
    expect(callsFor(dbHolder.current.calls, "selectFrom")[0].args).toEqual([
      "follows as f",
    ]);
  });
});
