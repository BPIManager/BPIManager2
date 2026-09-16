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

const { siteStatsSummaryRepo } = await import(
  "@/lib/db/aggregates/siteStats/summary"
);

describe("siteStatsSummaryRepo.getSummary", () => {
  it("totalAllScores/newAllScoresTodayはbk+scores+allLowの合算になること", async () => {
    // executeTakeFirstは常に同じcanned値を返すため、3系統(bk/scores/allLow)を
    // 合算するtotalAllScoresは count*3 になる
    dbHolder.current = createDbSpy({ count: 5 });
    const result = await siteStatsSummaryRepo.getSummary();

    expect(result.totalUsers).toBe(5);
    expect(result.totalAllScores).toBe(15);
    expect(result.newAllScoresToday).toBe(15);
  });

  it("結果がundefinedの場合すべて0になること", async () => {
    dbHolder.current = createDbSpy(undefined);
    const result = await siteStatsSummaryRepo.getSummary();
    expect(result).toEqual({
      totalUsers: 0,
      newUsersToday: 0,
      totalLogs: 0,
      newLogsToday: 0,
      totalAllScores: 0,
      newAllScoresToday: 0,
    });
  });
});

describe("siteStatsSummaryRepo.getArenaRankDistributionByVersion", () => {
  it("バージョンごとにARENA_RANK_ORDER全ランクを含み、該当データのないランクは0になること", async () => {
    dbHolder.current = createDbSpy([
      { version: "33", arenaClass: "A1", count: 10 },
      { version: "33", arenaClass: "A1", count: 5 },
      { version: "33", arenaClass: "B3", count: 3 },
      { version: "32", arenaClass: "A1", count: 2 },
    ]);

    const result = await siteStatsSummaryRepo.getArenaRankDistributionByVersion();

    const v33a1 = result["33"].find((r) => r.rank === "A1");
    const v33b3 = result["33"].find((r) => r.rank === "B3");
    const v33b1 = result["33"].find((r) => r.rank === "B1");
    const v32a1 = result["32"].find((r) => r.rank === "A1");
    expect(v33a1?.count).toBe(15);
    expect(v33b3?.count).toBe(3);
    expect(v33b1?.count).toBe(0);
    expect(v32a1?.count).toBe(2);
  });
});

describe("siteStatsSummaryRepo.getAreaDistribution", () => {
  it("areaがnullの行を除外して返すこと", async () => {
    dbHolder.current = createDbSpy([
      { area: "東京都", count: 10 },
      { area: null, count: 5 },
    ]);

    const result = await siteStatsSummaryRepo.getAreaDistribution();

    expect(result).toEqual([{ area: "東京都", count: 10 }]);
  });
});

describe("siteStatsSummaryRepo.getVersionScoreDistribution", () => {
  it("BK版数を先頭に、それ以外を数値昇順で並べ件数を合算すること", async () => {
    // bkRows/scoresRows/allScoresRowsはすべて同じcanned配列を返す
    dbHolder.current = createDbSpy([
      { version: "33", count: 10 },
      { version: "26", count: 5 },
    ]);

    const result = await siteStatsSummaryRepo.getVersionScoreDistribution();

    const versionOrder = result.versions.map((v) => v.version);
    expect(versionOrder[0]).toBe("26"); // BK_VERSIONSの先頭
    expect(versionOrder).toContain("33");
    const v33 = result.versions.find((v) => v.version === "33");
    // 3クエリすべてが同じ行を返すため 10*3 = 30
    expect(v33?.count).toBe(30);
  });
});
