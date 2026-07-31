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

const { statsTablesRepo } = await import("@/lib/db/aggregates/stats/tables");

describe("statsTablesRepo.getLatestTotalBpi", () => {
  it("結果がある場合数値化して返すこと", async () => {
    dbHolder.current = createDbSpy({ totalBpi: "35.5" });
    const result = await statsTablesRepo.getLatestTotalBpi("user-1", "33");
    expect(result).toBe(35.5);
  });

  it("結果がない場合-15を返すこと", async () => {
    dbHolder.current = createDbSpy(undefined);
    const result = await statsTablesRepo.getLatestTotalBpi("user-1", "33");
    expect(result).toBe(-15);
  });
});

describe("statsTablesRepo.getSongRanking", () => {
  it("非公開ユーザーを匿名化し、閲覧者のisSelf/selfRankを判定すること", async () => {
    dbHolder.current = createDbSpy([
      {
        userId: "viewer-1",
        userName: "自分",
        profileImage: null,
        isPublic: 1,
        exScore: 1800,
        bpi: "30",
      },
      {
        userId: "private-user",
        userName: "非公開",
        profileImage: "img.png",
        isPublic: 0,
        exScore: 1700,
        bpi: null,
      },
    ]);

    const result = await statsTablesRepo.getSongRanking(1, "33", "viewer-1");

    expect(result.rankings[0]).toMatchObject({
      rank: 1,
      userId: "viewer-1",
      bpi: 30,
      isSelf: true,
    });
    expect(result.rankings[1]).toMatchObject({
      rank: 2,
      userId: "anon-1",
      userName: "-",
      profileImage: null,
      bpi: null,
      isSelf: false,
    });
    expect(result.selfRank).toBe(1);
    expect(result.totalCount).toBe(2);
  });

  it("閲覧者が結果に含まれない場合selfRankは0になること", async () => {
    dbHolder.current = createDbSpy([
      { userId: "other", userName: "他人", profileImage: null, isPublic: 1, exScore: 1800, bpi: 30 },
    ]);
    const result = await statsTablesRepo.getSongRanking(1, "33", "viewer-1");
    expect(result.selfRank).toBe(0);
  });
});

describe("statsTablesRepo.getScoreHistory", () => {
  it("levels/difficultiesが空でない場合、絞り込みが追加されること", async () => {
    dbHolder.current = createDbSpy([]);
    await statsTablesRepo.getScoreHistory("user-1", "33", [12], ["ANOTHER"]);
    // ベース3件 + levels + difficulties = 5件
    expect(callsFor(dbHolder.current.calls, "where")).toHaveLength(5);
  });

  it("levels/difficultiesが空の場合、ベースのwhereのみになること", async () => {
    dbHolder.current = createDbSpy([]);
    await statsTablesRepo.getScoreHistory("user-1", "33", [], []);
    expect(callsFor(dbHolder.current.calls, "where")).toHaveLength(3);
  });
});

describe("statsTablesRepo.getTotalSongCount", () => {
  it("levels/difficultiesが指定された場合、追加のwhereが適用されること", async () => {
    dbHolder.current = createDbSpy({ count: 100 });
    await statsTablesRepo.getTotalSongCount([12], ["ANOTHER"]);
    expect(callsFor(dbHolder.current.calls, "where")).toHaveLength(2);
  });

  it("結果を数値で返すこと", async () => {
    dbHolder.current = createDbSpy({ count: "250" });
    const result = await statsTablesRepo.getTotalSongCount([], []);
    expect(result).toBe(250);
  });

  it("結果がない場合0を返すこと", async () => {
    dbHolder.current = createDbSpy(undefined);
    const result = await statsTablesRepo.getTotalSongCount([], []);
    expect(result).toBe(0);
  });
});

describe("statsTablesRepo.getUserSongRankings", () => {
  it("rank/totalPlayers/bpiを数値化すること", async () => {
    dbHolder.current = createDbSpy([
      { songId: 1, rank: "3", totalPlayers: "50", bpi: "20.5" },
    ]);
    const [row] = await statsTablesRepo.getUserSongRankings("user-1", "33");
    expect(row.rank).toBe(3);
    expect(row.totalPlayers).toBe(50);
    expect(row.bpi).toBe(20.5);
  });

  it("bpiがnullの場合nullを維持すること", async () => {
    dbHolder.current = createDbSpy([
      { songId: 1, rank: "1", totalPlayers: "1", bpi: null },
    ]);
    const [row] = await statsTablesRepo.getUserSongRankings("user-1", "33");
    expect(row.bpi).toBeNull();
  });
});

describe("statsTablesRepo.getFilteredSongKeys", () => {
  it("title___difficulty形式のSetを返すこと", async () => {
    dbHolder.current = createDbSpy([
      { title: "冥", difficulty: "ANOTHER" },
      { title: "覇", difficulty: "HYPER" },
    ]);
    const result = await statsTablesRepo.getFilteredSongKeys("33");
    expect(result).toEqual(new Set(["冥___ANOTHER", "覇___HYPER"]));
  });
});
