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

const { monthlyActivityRepo } = await import("@/lib/db/aggregates/monthly-review/activity");
const { monthlyBpiStateRepo } = await import("@/lib/db/aggregates/monthly-review/bpiState");
const { monthlyL1112Repo } = await import("@/lib/db/aggregates/monthly-review/l1112");

describe("monthlyReviewRepo: 空配列入力での早期return", () => {
  it("getPreMonthBpiStateForUsersはuserIdsが空ならDBに問い合わせず空配列を返すこと", async () => {
    dbHolder.current = createDbSpy([]);
    const result = await monthlyBpiStateRepo.getPreMonthBpiStateForUsers(
      [],
      "33",
      "2025-06-01",
    );
    expect(result).toEqual([]);
    expect(dbHolder.current.calls).toHaveLength(0);
  });

  it("getInMonthScoreHistoryForUsersはuserIdsが空なら空配列を返すこと", async () => {
    dbHolder.current = createDbSpy([]);
    const result = await monthlyBpiStateRepo.getInMonthScoreHistoryForUsers(
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
    const result = await monthlyBpiStateRepo.getScoresForBatches(
      "user-1",
      "33",
      [],
    );
    expect(result).toEqual([]);
    expect(dbHolder.current.calls).toHaveLength(0);
  });

  it("getPreMonthScoresByLastPlayedはsongIdsが空なら空配列を返すこと", async () => {
    dbHolder.current = createDbSpy([]);
    const result = await monthlyBpiStateRepo.getPreMonthScoresByLastPlayed(
      "user-1",
      "33",
      [],
      "2025-06-01",
    );
    expect(result).toEqual([]);
    expect(dbHolder.current.calls).toHaveLength(0);
  });

  it("getRivalsCurrentScoresForSongsはsongIdsが空なら空配列を返すこと", async () => {
    dbHolder.current = createDbSpy([]);
    const result = await monthlyL1112Repo.getRivalsCurrentScoresForSongs({
      ownerId: "owner-1",
      viewerId: "owner-1",
      version: "33",
      songIds: [],
    });
    expect(result).toEqual([]);
    expect(dbHolder.current.calls).toHaveLength(0);
  });
});

describe("monthlyL1112Repo.getRivalsCurrentScoresForSongs: 閲覧者別の可視範囲 (#296)", () => {
  it("所有者のフォローを f.followerId = ownerId で絞ること", async () => {
    dbHolder.current = createDbSpy([]);
    await monthlyL1112Repo.getRivalsCurrentScoresForSongs({
      ownerId: "owner-1",
      viewerId: "viewer-2",
      version: "33",
      songIds: [1],
    });
    const whereCalls = callsFor(dbHolder.current.calls, "where");
    expect(
      whereCalls.some(
        (c) => c.args[0] === "f.followerId" && c.args[2] === "owner-1",
      ),
    ).toBe(true);
  });

  it("第三者閲覧時(viewerId !== ownerId)は公開フォローのみ (u.isPublic = 1) に絞ること", async () => {
    dbHolder.current = createDbSpy([]);
    await monthlyL1112Repo.getRivalsCurrentScoresForSongs({
      ownerId: "owner-1",
      viewerId: "viewer-2",
      version: "33",
      songIds: [1],
    });
    const whereCalls = callsFor(dbHolder.current.calls, "where");
    // wherePublicOnly(qb, "u.isPublic") -> qb.where(sql.ref("u.isPublic"), "=", 1)
    expect(
      whereCalls.some((c) => c.args[1] === "=" && c.args[2] === 1),
    ).toBe(true);
  });

  it("未ログイン閲覧(viewerId undefined)も公開フォローのみに絞ること", async () => {
    dbHolder.current = createDbSpy([]);
    await monthlyL1112Repo.getRivalsCurrentScoresForSongs({
      ownerId: "owner-1",
      viewerId: undefined,
      version: "33",
      songIds: [1],
    });
    const whereCalls = callsFor(dbHolder.current.calls, "where");
    expect(
      whereCalls.some((c) => c.args[1] === "=" && c.args[2] === 1),
    ).toBe(true);
  });

  it("本人閲覧時(viewerId === ownerId)は承認記録を含む or 条件で絞ること(公開限定にしない)", async () => {
    dbHolder.current = createDbSpy([]);
    await monthlyL1112Repo.getRivalsCurrentScoresForSongs({
      ownerId: "owner-1",
      viewerId: "owner-1",
      version: "33",
      songIds: [1],
    });
    const whereCalls = callsFor(dbHolder.current.calls, "where");
    // 公開限定の where(sql.ref, "=", 1) は使わず、コールバック形式の or 条件を1つ積む
    expect(
      whereCalls.some((c) => c.args[1] === "=" && c.args[2] === 1),
    ).toBe(false);
    expect(
      whereCalls.some((c) => typeof c.args[0] === "function"),
    ).toBe(true);
  });
});

describe("monthlyActivityRepo.getMonthlyTowerStats", () => {
  it("結果を数値に変換して返すこと", async () => {
    dbHolder.current = createDbSpy({
      totalKeys: "1000",
      totalScratches: "100",
      playDays: "10",
    });
    const result = await monthlyActivityRepo.getMonthlyTowerStats(
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
    const result = await monthlyActivityRepo.getMonthlyTowerStats(
      "user-1",
      "33",
      "2025-06-01",
      "2025-06-30",
    );
    expect(result).toEqual({ totalKeys: 0, totalScratches: 0, playDays: 0 });
  });
});

describe("monthlyActivityRepo.getMonthlyTowerRanking", () => {
  it("結果がない場合nullを返すこと", async () => {
    dbHolder.current = createDbSpy(undefined);
    const result = await monthlyActivityRepo.getMonthlyTowerRanking(
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
    const result = await monthlyActivityRepo.getMonthlyTowerRanking(
      "user-1",
      "33",
      "2025-06-01",
      "2025-06-30",
    );
    expect(result).toEqual({ keysRank: 3, scratchRank: 5, totalUsers: 100 });
  });
});

describe("monthlyActivityRepo.getAvailableMonths", () => {
  it("month列だけを抽出した配列を返すこと", async () => {
    dbHolder.current = createDbSpy([
      { month: "2025-06" },
      { month: "2025-05" },
    ]);
    const result = await monthlyActivityRepo.getAvailableMonths(
      "user-1",
      "33",
    );
    expect(result).toEqual(["2025-06", "2025-05"]);
  });
});
