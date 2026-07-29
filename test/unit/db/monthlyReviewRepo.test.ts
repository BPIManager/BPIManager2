import { describe, it, expect, vi } from "vitest";
import { createDbSpy } from "../helpers/dbQuerySpy";

const { dbHolder } = vi.hoisted(() => ({
  dbHolder: { current: null as ReturnType<typeof import("../helpers/dbQuerySpy")["createDbSpy"]> | null },
}));

vi.mock("@/lib/db", () => ({
  get db() {
    return dbHolder.current!.db;
  },
}));

const { monthlyReviewRepo } = await import("@/lib/db/monthly-review");

describe("monthlyReviewRepo: 空配列入力での早期return", () => {
  it("getPreMonthBpiStateForUsersはuserIdsが空ならDBに問い合わせず空配列を返すこと", async () => {
    dbHolder.current = createDbSpy([]);
    const result = await monthlyReviewRepo.getPreMonthBpiStateForUsers(
      [],
      "33",
      "2025-06-01",
    );
    expect(result).toEqual([]);
    expect(dbHolder.current.calls).toHaveLength(0);
  });

  it("getInMonthScoreHistoryForUsersはuserIdsが空なら空配列を返すこと", async () => {
    dbHolder.current = createDbSpy([]);
    const result = await monthlyReviewRepo.getInMonthScoreHistoryForUsers(
      [],
      "33",
      "2025-06-01",
      "2025-06-30",
    );
    expect(result).toEqual([]);
    expect(dbHolder.current.calls).toHaveLength(0);
  });

  it("getScoresForBatchesはbatchIdsが空なら空配列を返すこと", async () => {
    dbHolder.current = createDbSpy([]);
    const result = await monthlyReviewRepo.getScoresForBatches(
      "user-1",
      "33",
      [],
    );
    expect(result).toEqual([]);
    expect(dbHolder.current.calls).toHaveLength(0);
  });

  it("getPreMonthScoresByLastPlayedはsongIdsが空なら空配列を返すこと", async () => {
    dbHolder.current = createDbSpy([]);
    const result = await monthlyReviewRepo.getPreMonthScoresByLastPlayed(
      "user-1",
      "33",
      [],
      "2025-06-01",
    );
    expect(result).toEqual([]);
    expect(dbHolder.current.calls).toHaveLength(0);
  });

  it("getBatchSongRanksはsongIdsが空なら空のMapを返すこと", async () => {
    dbHolder.current = createDbSpy([]);
    const result = await monthlyReviewRepo.getBatchSongRanks(
      "user-1",
      "33",
      [],
    );
    expect(result).toEqual(new Map());
    expect(dbHolder.current.calls).toHaveLength(0);
  });

  it("getRivalsCurrentScoresForSongsはsongIdsが空なら空配列を返すこと", async () => {
    dbHolder.current = createDbSpy([]);
    const result = await monthlyReviewRepo.getRivalsCurrentScoresForSongs(
      "viewer-1",
      "33",
      [],
    );
    expect(result).toEqual([]);
    expect(dbHolder.current.calls).toHaveLength(0);
  });
});

describe("monthlyReviewRepo.getMonthlyTowerStats", () => {
  it("結果を数値に変換して返すこと", async () => {
    dbHolder.current = createDbSpy({
      totalKeys: "1000",
      totalScratches: "100",
      playDays: "10",
    });
    const result = await monthlyReviewRepo.getMonthlyTowerStats(
      "user-1",
      "33",
      "2025-06-01",
      "2025-06-30",
    );
    expect(result).toEqual({
      totalKeys: 1000,
      totalScratches: 100,
      playDays: 10,
    });
  });

  it("結果がundefinedの場合すべて0を返すこと", async () => {
    dbHolder.current = createDbSpy(undefined);
    const result = await monthlyReviewRepo.getMonthlyTowerStats(
      "user-1",
      "33",
      "2025-06-01",
      "2025-06-30",
    );
    expect(result).toEqual({ totalKeys: 0, totalScratches: 0, playDays: 0 });
  });
});

describe("monthlyReviewRepo.getMonthlyTowerRanking", () => {
  it("結果がない場合nullを返すこと", async () => {
    dbHolder.current = createDbSpy(undefined);
    const result = await monthlyReviewRepo.getMonthlyTowerRanking(
      "user-1",
      "33",
      "2025-06-01",
      "2025-06-30",
    );
    expect(result).toBeNull();
  });

  it("結果がある場合数値に変換して返すこと", async () => {
    dbHolder.current = createDbSpy({
      keysRank: "3",
      scratchRank: "5",
      totalUsers: "100",
    });
    const result = await monthlyReviewRepo.getMonthlyTowerRanking(
      "user-1",
      "33",
      "2025-06-01",
      "2025-06-30",
    );
    expect(result).toEqual({ keysRank: 3, scratchRank: 5, totalUsers: 100 });
  });
});

describe("monthlyReviewRepo.getBatchSongRanks", () => {
  it("行データをsongId->rankのMapに変換すること", async () => {
    dbHolder.current = createDbSpy([
      { songId: 1, rnk: "2" },
      { songId: 2, rnk: "1" },
    ]);
    const result = await monthlyReviewRepo.getBatchSongRanks(
      "user-1",
      "33",
      [1, 2],
    );
    expect(result).toEqual(
      new Map([
        [1, 2],
        [2, 1],
      ]),
    );
  });
});

describe("monthlyReviewRepo.getAvailableMonths", () => {
  it("month列だけを抽出した配列を返すこと", async () => {
    dbHolder.current = createDbSpy([
      { month: "2025-06" },
      { month: "2025-05" },
    ]);
    const result = await monthlyReviewRepo.getAvailableMonths(
      "user-1",
      "33",
    );
    expect(result).toEqual(["2025-06", "2025-05"]);
  });
});
