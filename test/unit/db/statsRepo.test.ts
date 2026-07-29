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

const { statsRepo } = await import("@/lib/db/stats");

describe("statsRepo.getLatestTotalBpi", () => {
  it("結果がある場合数値化して返すこと", async () => {
    dbHolder.current = createDbSpy({ totalBpi: "35.5" });
    const result = await statsRepo.getLatestTotalBpi("user-1", "33");
    expect(result).toBe(35.5);
  });

  it("結果がない場合-15を返すこと", async () => {
    dbHolder.current = createDbSpy(undefined);
    const result = await statsRepo.getLatestTotalBpi("user-1", "33");
    expect(result).toBe(-15);
  });
});

describe("statsRepo.getSongRanking", () => {
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

    const result = await statsRepo.getSongRanking(1, "33", "viewer-1");

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
    const result = await statsRepo.getSongRanking(1, "33", "viewer-1");
    expect(result.selfRank).toBe(0);
  });
});

describe("statsRepo.getTotalSongCount", () => {
  it("levels/difficultiesが指定された場合、追加のwhereが適用されること", async () => {
    dbHolder.current = createDbSpy({ count: 100 });
    await statsRepo.getTotalSongCount([12], ["ANOTHER"]);
    expect(callsFor(dbHolder.current.calls, "where")).toHaveLength(2);
  });

  it("結果を数値で返すこと", async () => {
    dbHolder.current = createDbSpy({ count: "250" });
    const result = await statsRepo.getTotalSongCount([], []);
    expect(result).toBe(250);
  });

  it("結果がない場合0を返すこと", async () => {
    dbHolder.current = createDbSpy(undefined);
    const result = await statsRepo.getTotalSongCount([], []);
    expect(result).toBe(0);
  });
});

describe("statsRepo.getUserSongRankings", () => {
  it("rank/totalPlayers/bpiを数値化すること", async () => {
    dbHolder.current = createDbSpy([
      { songId: 1, rank: "3", totalPlayers: "50", bpi: "20.5" },
    ]);
    const [row] = await statsRepo.getUserSongRankings("user-1", "33");
    expect(row.rank).toBe(3);
    expect(row.totalPlayers).toBe(50);
    expect(row.bpi).toBe(20.5);
  });

  it("bpiがnullの場合nullを維持すること", async () => {
    dbHolder.current = createDbSpy([
      { songId: 1, rank: "1", totalPlayers: "1", bpi: null },
    ]);
    const [row] = await statsRepo.getUserSongRankings("user-1", "33");
    expect(row.bpi).toBeNull();
  });
});

describe("statsRepo.getFilteredSongKeys", () => {
  it("title___difficulty形式のSetを返すこと", async () => {
    dbHolder.current = createDbSpy([
      { title: "冥", difficulty: "ANOTHER" },
      { title: "覇", difficulty: "HYPER" },
    ]);
    const result = await statsRepo.getFilteredSongKeys("33");
    expect(result).toEqual(new Set(["冥___ANOTHER", "覇___HYPER"]));
  });
});

describe("statsRepo.getNeighborIds", () => {
  it("userIdの配列を返すこと", async () => {
    dbHolder.current = createDbSpy([
      { userId: "user-a" },
      { userId: "user-b" },
    ]);
    const result = await statsRepo.getNeighborIds(30, "user-1", "33", 5);
    expect(result).toEqual(["user-a", "user-b"]);
    expect(callsFor(dbHolder.current.calls, "limit")[0].args).toEqual([5]);
  });
});

describe("statsRepo.getNeighborScoreComparison", () => {
  it("neighborIdsが空の場合、DBに問い合わせず空配列を返すこと", async () => {
    dbHolder.current = createDbSpy([]);
    const result = await statsRepo.getNeighborScoreComparison(
      "user-1",
      [],
      "33",
    );
    expect(result).toEqual([]);
    expect(dbHolder.current.calls).toHaveLength(0);
  });
});
