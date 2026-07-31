import { describe, it, expect, vi } from "vitest";
import { createDbSpy, createQueryBuilderSpy, callsFor } from "../helpers/dbQuerySpy";

const { dbHolder } = vi.hoisted(() => ({
  dbHolder: {
    current: null as ReturnType<
      typeof import("../helpers/dbQuerySpy")["createDbSpy"]
    > | null,
  },
}));

vi.mock("@/lib/db", () => ({
  get db() {
    return dbHolder.current!.db;
  },
}));

const {
  latestLogIdPerSongSubquery,
  latestLogIdPerUserSongSubquery,
  latestLogIdPerSongScalarSubquery,
  latestLogIdPerUserSongScalarSubquery,
  correlatedLatestLogId,
} = await import("@/lib/db/shared/latestScore");

describe("latestLogIdPerSongSubquery", () => {
  it("table/userId/versionでのwhereとsongIdでのgroupByを組み立てること", () => {
    dbHolder.current = createDbSpy(undefined);

    latestLogIdPerSongSubquery({
      table: "scores",
      userId: "user-1",
      version: "33",
    });

    expect(callsFor(dbHolder.current.calls, "selectFrom")[0].args).toEqual([
      "scores",
    ]);
    const whereCalls = callsFor(dbHolder.current.calls, "where");
    expect(whereCalls).toContainEqual({
      method: "where",
      args: ["userId", "=", "user-1"],
    });
    expect(whereCalls).toContainEqual({
      method: "where",
      args: ["version", "=", "33"],
    });
    expect(callsFor(dbHolder.current.calls, "groupBy")[0].args).toEqual([
      "songId",
    ]);
  });

  it("versionを省略した場合、version絞り込みのwhereが呼ばれないこと", () => {
    dbHolder.current = createDbSpy(undefined);

    latestLogIdPerSongSubquery({
      table: "allScores",
      userId: "user-1",
    });

    const whereCalls = callsFor(dbHolder.current.calls, "where");
    expect(whereCalls).toHaveLength(1);
    expect(whereCalls[0].args).toEqual(["userId", "=", "user-1"]);
  });

  it("extraコールバックで追加の絞り込みを差し込めること", () => {
    dbHolder.current = createDbSpy(undefined);

    latestLogIdPerSongSubquery({
      table: "scores",
      userId: "user-1",
      version: "33",
      extra: (qb) => qb.where("lastPlayed", "<", "2025-01-01"),
    });

    const whereCalls = callsFor(dbHolder.current.calls, "where");
    expect(whereCalls).toContainEqual({
      method: "where",
      args: ["lastPlayed", "<", "2025-01-01"],
    });
  });
});

describe("latestLogIdPerUserSongSubquery", () => {
  it("followersOf指定時はuserIdをfollows経由のinサブクエリで絞り込むこと", () => {
    dbHolder.current = createDbSpy(undefined);

    latestLogIdPerUserSongSubquery({
      table: "scores",
      version: "33",
      followersOf: "viewer-1",
    });

    const whereCalls = callsFor(dbHolder.current.calls, "where");
    const inCall = whereCalls.find(
      (c) => c.args[0] === "userId" && c.args[1] === "in",
    );
    expect(inCall).toBeDefined();
    expect(typeof inCall!.args[2]).toBe("function");
    expect(callsFor(dbHolder.current.calls, "groupBy")[0].args).toEqual([
      ["userId", "songId"],
    ]);
  });

  it("userIds配列指定時はuserIdを配列でinフィルタすること", () => {
    dbHolder.current = createDbSpy(undefined);

    latestLogIdPerUserSongSubquery({
      table: "scores",
      version: "33",
      userIds: ["a", "b"],
    });

    const whereCalls = callsFor(dbHolder.current.calls, "where");
    expect(whereCalls).toContainEqual({
      method: "where",
      args: ["userId", "in", ["a", "b"]],
    });
  });

  it("songIds指定時はsongIdのinフィルタが追加されること", () => {
    dbHolder.current = createDbSpy(undefined);

    latestLogIdPerUserSongSubquery({
      table: "scores",
      version: "33",
      userIds: ["a"],
      songIds: [10, 20],
    });

    const whereCalls = callsFor(dbHolder.current.calls, "where");
    expect(whereCalls).toContainEqual({
      method: "where",
      args: ["songId", "in", [10, 20]],
    });
  });

  it("userIds/followersOfどちらも省略した場合、userIdのinフィルタは呼ばれないこと(全ユーザー対象)", () => {
    dbHolder.current = createDbSpy(undefined);

    latestLogIdPerUserSongSubquery({
      table: "scores",
      version: "33",
      songIds: [1],
    });

    const whereCalls = callsFor(dbHolder.current.calls, "where");
    expect(whereCalls.some((c) => c.args[0] === "userId")).toBe(false);
  });
});

describe("latestLogIdPerSongScalarSubquery", () => {
  it("logId列のみを選択しsongIdでgroupByすること(IN句用スカラーサブクエリ)", () => {
    dbHolder.current = createDbSpy(undefined);

    latestLogIdPerSongScalarSubquery({
      table: "scores",
      userId: "user-1",
      version: "33",
    });

    expect(callsFor(dbHolder.current.calls, "select")).toHaveLength(1);
    expect(callsFor(dbHolder.current.calls, "groupBy")[0].args).toEqual([
      "songId",
    ]);
  });
});

describe("latestLogIdPerUserSongScalarSubquery", () => {
  it("songIdsを1件のみ指定した場合でもuserId,songIdでgroupByすること", () => {
    dbHolder.current = createDbSpy(undefined);

    latestLogIdPerUserSongScalarSubquery({
      table: "allScores",
      version: "33",
      songIds: [42],
    });

    const whereCalls = callsFor(dbHolder.current.calls, "where");
    expect(whereCalls).toContainEqual({
      method: "where",
      args: ["songId", "in", [42]],
    });
    expect(callsFor(dbHolder.current.calls, "groupBy")[0].args).toEqual([
      ["userId", "songId"],
    ]);
  });
});

describe("correlatedLatestLogId", () => {
  it("固定userIdで相関サブクエリを組み立てること", () => {
    const { proxy: eb, calls } = createQueryBuilderSpy(undefined);

    correlatedLatestLogId(eb, {
      table: "scores",
      alias: "v2",
      songIdRef: "s.songId",
      version: "33",
      userId: "viewer-1",
    });

    expect(callsFor(calls, "selectFrom")[0].args).toEqual(["scores as v2"]);
    const whereCalls = callsFor(calls, "where");
    expect(
      whereCalls.some((c) => c.args[1] === "=" && c.args[2] === "viewer-1"),
    ).toBe(true);
    expect(callsFor(calls, "whereRef")).toHaveLength(1);
  });

  it("followersOf指定時はfollowsサブクエリでのinフィルタになること", () => {
    const { proxy: eb, calls } = createQueryBuilderSpy(undefined);

    correlatedLatestLogId(eb, {
      table: "scores",
      alias: "r2",
      songIdRef: "s.songId",
      version: "33",
      followersOf: "viewer-1",
    });

    const whereCalls = callsFor(calls, "where");
    expect(whereCalls.some((c) => c.args[1] === "in")).toBe(true);
  });

  it("userIdRef指定時はwhereRefで外側カラムに相関させること", () => {
    const { proxy: eb, calls } = createQueryBuilderSpy(undefined);

    correlatedLatestLogId(eb, {
      table: "scores",
      alias: "r2",
      songIdRef: "s.songId",
      version: "33",
      userIdRef: "r.userId",
    });

    // songId相関 + userId相関で計2回whereRefが呼ばれる
    expect(callsFor(calls, "whereRef")).toHaveLength(2);
  });
});
