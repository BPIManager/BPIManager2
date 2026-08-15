import { describe, it, expect, vi } from "vitest";
import { sql } from "kysely";
import { createDbSpy, callsFor } from "../helpers/dbQuerySpy";

const { dbHolder } = vi.hoisted(() => ({
  dbHolder: { current: null as ReturnType<typeof import("../helpers/dbQuerySpy")["createDbSpy"]> | null },
}));

vi.mock("@/lib/db", () => ({
  get db() {
    return dbHolder.current!.db;
  },
}));

const { rivalRepo } = await import("@/lib/db/aggregates/rivalScores/rival");
const { scoreDetailRepo } = await import("@/lib/db/domains/scores/detail");
const { timelineRepo } = await import("@/lib/db/domains/scores/timeline");
const { scoreTimelineRepo } = await import("@/lib/db/aggregates/scoreTimeline");

describe("rivalRepo.getRivalComparisonScores", () => {
  it("limit/offsetが指定された場合のみ適用されること", async () => {
    dbHolder.current = createDbSpy([]);
    await rivalRepo.getRivalComparisonScores({
      viewerId: "user-1",
      version: "33",
      limit: 20,
      offset: 10,
    });
    expect(callsFor(dbHolder.current.calls, "limit")).toHaveLength(1);
    expect(callsFor(dbHolder.current.calls, "offset")).toHaveLength(1);
  });

  it("limit/offset未指定の場合は適用されないこと", async () => {
    dbHolder.current = createDbSpy([]);
    await rivalRepo.getRivalComparisonScores({
      viewerId: "user-1",
      version: "33",
    });
    expect(callsFor(dbHolder.current.calls, "limit")).toHaveLength(0);
    expect(callsFor(dbHolder.current.calls, "offset")).toHaveLength(0);
  });
});

describe("rivalRepo.getScoreComparisonList", () => {
  it("levelArray/diffArray/cursorが指定された場合、追加のwhereが適用されること", async () => {
    dbHolder.current = createDbSpy([]);
    await rivalRepo.getScoreComparisonList({
      userId: "user-1",
      version: "33",
      limit: 20,
      minDiff: 0,
      maxDiff: 100,
      levelArray: [12],
      diffArray: ["ANOTHER"],
      cursor: { lastDiff: 10, lastSongId: "1", lastRivalId: "r1" },
    });
    // ベース(minDiff,maxDiff)2件 + levelArray + diffArray + cursor = 5件
    expect(callsFor(dbHolder.current.calls, "where")).toHaveLength(5);
  });

  it("levelArray/diffArray/cursorが空の場合、ベースのwhereのみになること", async () => {
    dbHolder.current = createDbSpy([]);
    await rivalRepo.getScoreComparisonList({
      userId: "user-1",
      version: "33",
      limit: 20,
      minDiff: 0,
      maxDiff: 100,
      levelArray: [],
      diffArray: [],
    });
    expect(callsFor(dbHolder.current.calls, "where")).toHaveLength(2);
  });
});

describe("rivalRepo.getOvertakenRivals", () => {
  it("batchId指定時はbatchIdでの絞り込みを追加すること", async () => {
    dbHolder.current = createDbSpy([]);
    await rivalRepo.getOvertakenRivals("user-1", "33", { batchId: "batch-1" });
    const whereCalls = callsFor(dbHolder.current.calls, "where");
    expect(whereCalls.some((c) => c.args[0] === "current.batchId")).toBe(
      true,
    );
  });

  it("range指定時は期間での絞り込みを追加すること", async () => {
    dbHolder.current = createDbSpy([]);
    await rivalRepo.getOvertakenRivals("user-1", "33", {
      range: {
        start: new Date("2025-06-01"),
        end: new Date("2025-06-30"),
        basis: "lastPlayed",
      },
    });
    const whereCalls = callsFor(dbHolder.current.calls, "where");
    expect(
      whereCalls.some((c) => c.args[0] === "current.lastPlayed"),
    ).toBe(true);
  });

  it("isPublicでの絞り込みを追加しないこと(#275: followsの存在=閲覧許可のため不要)", async () => {
    dbHolder.current = createDbSpy([]);
    await rivalRepo.getOvertakenRivals("user-1", "33", { batchId: "batch-1" });
    const whereCalls = callsFor(dbHolder.current.calls, "where");
    expect(
      whereCalls.some(
        (c) =>
          JSON.stringify(c.args[0]) === JSON.stringify(sql.ref("ru.isPublic")),
      ),
    ).toBe(false);
  });
});

describe("rivalRepo.getRivalLatestScoresBySong", () => {
  it("songIdsが空の場合、DBに問い合わせず空配列を返すこと", async () => {
    dbHolder.current = createDbSpy([]);
    const result = await rivalRepo.getRivalLatestScoresBySong({
      userId: "user-1",
      version: "33",
      songIds: [],
    });
    expect(result).toEqual([]);
    expect(dbHolder.current.calls).toHaveLength(0);
  });
});

describe("rivalRepo.getFollowedScoresForSong", () => {
  it("followsとscoresを結合したクエリを実行し結果をそのまま返すこと", async () => {
    const rows = [{ userId: "rival-1", exScore: 1800 }];
    dbHolder.current = createDbSpy(rows);

    const result = await rivalRepo.getFollowedScoresForSong({
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

describe("rivalRepo.getRivalAvgScores / getRivalTopScores", () => {
  it("getRivalAvgScoresはsongIds指定時にsongIdでのwhere絞り込みが含まれること", async () => {
    dbHolder.current = createDbSpy([]);
    await rivalRepo.getRivalAvgScores({
      userId: "user-1",
      version: "33",
      songIds: [1, 2],
    });
    const whereCalls = callsFor(dbHolder.current.calls, "where");
    expect(
      whereCalls.some(
        (c) => c.args[0] === "songId" && c.args[1] === "in" && Array.isArray(c.args[2]) && (c.args[2] as number[]).includes(1),
      ),
    ).toBe(true);
  });

  it("getRivalTopScoresはsongIds未指定時にsongIdでのwhere絞り込みが含まれないこと", async () => {
    dbHolder.current = createDbSpy([]);
    await rivalRepo.getRivalTopScores({ userId: "user-1", version: "33" });
    const whereCalls = callsFor(dbHolder.current.calls, "where");
    expect(whereCalls.some((c) => c.args[0] === "songId")).toBe(false);
  });
});

describe("scoreDetailRepo.getScoresWithDetails", () => {
  it("batchIds指定時はbatchIdでの絞り込みが優先されること", async () => {
    dbHolder.current = createDbSpy([]);
    await scoreDetailRepo.getScoresWithDetails("user-1", "33", {
      batchIds: ["batch-1"],
    });
    const whereCalls = callsFor(dbHolder.current.calls, "where");
    expect(
      whereCalls.some((c) => c.args[0] === "current.batchId"),
    ).toBe(true);
  });

  it("onlyLastPlayedInRange指定時は期間での絞り込みになること", async () => {
    dbHolder.current = createDbSpy([]);
    await scoreDetailRepo.getScoresWithDetails("user-1", "33", {
      onlyLastPlayedInRange: {
        start: new Date("2025-06-01"),
        end: new Date("2025-06-30"),
      },
    });
    const whereCalls = callsFor(dbHolder.current.calls, "where");
    expect(
      whereCalls.some((c) => c.args[0] === "current.lastPlayed"),
    ).toBe(true);
  });

  it("INF以外のバージョンでは$ifにtrueを渡すこと", async () => {
    dbHolder.current = createDbSpy([]);
    await scoreDetailRepo.getScoresWithDetails("user-1", "33", {});
    expect(callsFor(dbHolder.current.calls, "$if")[0].args[0]).toBe(true);
  });
});

describe("scoreTimelineRepo.getTimelineByBatches", () => {
  it("バッチごとにログをグループ化しtopScoresを構築すること", async () => {
    dbHolder.current = createDbSpy([
      {
        l_id: 1,
        l_batchId: "batch-1",
        l_totalBpi: 30,
        l_prevTotalBpi: 25,
        l_version: "33",
        l_createdAt: "2025-06-02",
        songCount: 5,
        ts_title: "冥",
        ts_bpi: 40,
        ts_clearState: "HARD CLEAR",
        rn: 1,
      },
      {
        l_id: 1,
        l_batchId: "batch-1",
        l_totalBpi: 30,
        l_prevTotalBpi: 25,
        l_version: "33",
        l_createdAt: "2025-06-02",
        songCount: 5,
        ts_title: "覇",
        ts_bpi: 35,
        ts_clearState: "CLEAR",
        rn: 2,
      },
    ]);

    const result = await scoreTimelineRepo.getTimelineByBatches({
      userId: "user-1",
      version: "33",
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      batchId: "batch-1",
      totalBpi: 30,
      diff: 5,
      songCount: 5,
    });
    expect(result[0].topScores).toHaveLength(2);
  });

  it("l_prevTotalBpiがnullの場合diffは0になること", async () => {
    dbHolder.current = createDbSpy([
      {
        l_id: 1,
        l_batchId: "batch-1",
        l_totalBpi: 30,
        l_prevTotalBpi: null,
        l_version: "33",
        l_createdAt: "2025-06-02",
        songCount: 0,
        ts_title: null,
        ts_bpi: null,
        ts_clearState: null,
        rn: null,
      },
    ]);

    const result = await scoreTimelineRepo.getTimelineByBatches({
      userId: "user-1",
      version: "33",
    });

    expect(result[0].diff).toBe(0);
    expect(result[0].topScores).toHaveLength(0);
  });

  it("since/untilを指定してもエラーなく実行できること", async () => {
    // since/untilの条件分岐はdb.selectFrom(qb => ...)のコールバック内にあり、
    // クエリスパイはコールバック引数を実行しないため分岐自体は検証できない。
    // ここでは指定時にクラッシュしないことのみ確認する。
    dbHolder.current = createDbSpy([]);
    const result = await scoreTimelineRepo.getTimelineByBatches({
      userId: "user-1",
      version: "33",
      since: new Date("2025-06-01"),
      until: new Date("2025-06-30"),
    });
    expect(result).toEqual([]);
  });
});

describe("timelineRepo.getBestEverScores", () => {
  it("excludeCurrent=trueの場合、対象バージョンを除外するwhereが追加されること", async () => {
    dbHolder.current = createDbSpy([]);
    await timelineRepo.getBestEverScores({
      userId: "user-1",
      currentVersion: "33",
      excludeCurrent: true,
    });
    const whereCalls = callsFor(dbHolder.current.calls, "where");
    expect(
      whereCalls.some(
        (c) => c.args[0] === "sc.version" && c.args[1] === "!=",
      ),
    ).toBe(true);
  });
});

describe("timelineRepo.getSelfVersionScores", () => {
  it("currentVersionがINFの場合$ifにfalseを渡すこと", async () => {
    dbHolder.current = createDbSpy([]);
    await timelineRepo.getSelfVersionScores({
      userId: "user-1",
      currentVersion: "INF",
      targetVersion: "33",
    });
    expect(callsFor(dbHolder.current.calls, "$if")[0].args[0]).toBe(false);
  });
});
