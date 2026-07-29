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

const { metricsRepo } = await import("@/lib/db/metrics");

describe("metricsRepo.getSongDefs", () => {
  it("isCurrent=1の曲定義のみを取得すること", async () => {
    const rows = [{ title: "冥" }];
    dbHolder.current = createDbSpy(rows);
    const result = await metricsRepo.getSongDefs();
    expect(result).toEqual(rows);
    expect(callsFor(dbHolder.current.calls, "where")[0].args).toEqual([
      "sd.isCurrent",
      "=",
      1,
    ]);
  });
});

describe("metricsRepo.getAllSongs", () => {
  it("songsテーブルの基本情報を取得すること", async () => {
    const rows = [{ title: "冥", difficulty: "ANOTHER", notes: 1000 }];
    dbHolder.current = createDbSpy(rows);
    const result = await metricsRepo.getAllSongs();
    expect(result).toEqual(rows);
    expect(callsFor(dbHolder.current.calls, "selectFrom")[0].args).toEqual([
      "songs",
    ]);
  });
});

describe("metricsRepo.getArenaAverageScores", () => {
  it("bkScoresベースでA1〜A5ランクに絞り込んで集計すること", async () => {
    const rows = [{ title: "冥", arenarank: "A1", avgExScore: 1800 }];
    dbHolder.current = createDbSpy(rows);
    const result = await metricsRepo.getArenaAverageScores("32", 12);
    expect(result).toEqual(rows);
    const whereCalls = callsFor(dbHolder.current.calls, "where");
    expect(
      whereCalls.some(
        (c) =>
          Array.isArray(c.args[2]) &&
          (c.args[2] as string[]).includes("A1"),
      ),
    ).toBe(true);
  });
});

describe("metricsRepo.getArenaAverageScoresFromScores", () => {
  it("scoresテーブルベースで集計すること", async () => {
    const rows = [{ title: "冥", arenarank: "A2", avgExScore: 1700 }];
    dbHolder.current = createDbSpy(rows);
    const result = await metricsRepo.getArenaAverageScoresFromScores(
      "33",
      12,
    );
    expect(result).toEqual(rows);
    expect(callsFor(dbHolder.current.calls, "selectFrom")[0].args).toEqual([
      "scores as s",
    ]);
  });
});
