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

const { allScoresRepo } = await import("@/lib/db/allScores");

describe("allScoresRepo.getAllScoresList", () => {
  it("フィルタなしの場合、ベースのwhere(deletedAt)のみが適用されること", async () => {
    dbHolder.current = createDbSpy([]);
    await allScoresRepo.getAllScoresList("user-1", {
      search: "",
      levels: "",
      difficulties: "",
      clearStates: "",
      sortKey: "level",
      sortOrder: "desc",
    });
    expect(callsFor(dbHolder.current.calls, "where")).toHaveLength(1);
  });

  it("search/levels/difficulties/clearStatesを指定するとwhere呼び出しが増えること", async () => {
    dbHolder.current = createDbSpy([]);
    await allScoresRepo.getAllScoresList("user-1", {
      search: "冥",
      levels: "11,12",
      difficulties: "ANOTHER,HYPER",
      clearStates: "CLEAR,HARD CLEAR",
      sortKey: "level",
      sortOrder: "desc",
    });
    // ベース1件 + search + levels + difficulties + clearStates = 5件
    expect(callsFor(dbHolder.current.calls, "where")).toHaveLength(5);
  });

  it("sortKeyに応じたorderByカラムが指定されること", async () => {
    dbHolder.current = createDbSpy([]);
    await allScoresRepo.getAllScoresList("user-1", {
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
    const results = await allScoresRepo.getAllScoresList("user-1", {
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

describe("allScoresRepo.getRivalScoresForAllSong", () => {
  it("followsとallScoresを結合したクエリを実行し結果をそのまま返すこと", async () => {
    const rows = [{ userId: "rival-1", exScore: 1800 }];
    dbHolder.current = createDbSpy(rows);

    const result = await allScoresRepo.getRivalScoresForAllSong({
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

describe("allScoresRepo.getAllSongRanking", () => {
  it("非公開ユーザーを匿名化し、閲覧者自身のisSelf/selfRankを判定すること", async () => {
    dbHolder.current = createDbSpy([
      {
        userId: "viewer-1",
        userName: "自分",
        profileImage: null,
        isPublic: 1,
        exScore: 1800,
        bpi: "30.5",
      },
      {
        userId: "private-user",
        userName: "非公開ユーザー",
        profileImage: null,
        isPublic: 0,
        exScore: 1700,
        bpi: null,
      },
    ]);

    const result = await allScoresRepo.getAllSongRanking(1, "33", "viewer-1");

    expect(result.totalCount).toBe(2);
    expect(result.rankings[0]).toMatchObject({
      rank: 1,
      userId: "viewer-1",
      userName: "自分",
      bpi: 30.5,
      isSelf: true,
    });
    expect(result.rankings[1]).toMatchObject({
      rank: 2,
      userId: "anon-1",
      userName: "-",
      bpi: null,
      isSelf: false,
    });
    expect(result.selfRank).toBe(1);
  });

  it("閲覧者が結果に含まれない場合selfRankは0になること", async () => {
    dbHolder.current = createDbSpy([
      {
        userId: "other-user",
        userName: "他人",
        profileImage: null,
        isPublic: 1,
        exScore: 1800,
        bpi: 30,
      },
    ]);

    const result = await allScoresRepo.getAllSongRanking(1, "33", "viewer-1");
    expect(result.selfRank).toBe(0);
  });
});

describe("allScoresRepo.getScoreHistory", () => {
  it("バージョンごとに履歴をグループ化すること", async () => {
    dbHolder.current = createDbSpy([
      { version: "33", exScore: 1800 },
      { version: "33", exScore: 1700 },
      { version: "32", exScore: 1600 },
      { version: null, exScore: 1000 },
    ]);

    const result = await allScoresRepo.getScoreHistory("user-1", "1");

    expect(Object.keys(result).sort()).toEqual(["32", "33", "unknown"]);
    expect(result["33"]).toHaveLength(2);
    expect(result["32"]).toHaveLength(1);
    expect(result["unknown"]).toHaveLength(1);
  });

  it("履歴が空の場合、空オブジェクトを返すこと", async () => {
    dbHolder.current = createDbSpy([]);
    const result = await allScoresRepo.getScoreHistory("user-1", "1");
    expect(result).toEqual({});
  });
});
