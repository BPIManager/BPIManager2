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

const { getStatsPrivacy, upsertStatsPrivacy } = await import(
  "@/lib/db/domains/statsPrivacy"
);
const {
  getBestArenaClassPerVersion,
  upsertOfficialArenaStats,
  getLatestArenaStatsPerVersion,
  getArenaStatsHistory,
  latestPerUserSubquery,
} = await import("@/lib/db/domains/officialArenaStats");

describe("officialArenaStats.latestPerUserSubquery", () => {
  it("versionで絞り込みuserIdごとにグループ化するクエリを組み立てること", () => {
    dbHolder.current = createDbSpy(undefined);
    latestPerUserSubquery("33");
    expect(callsFor(dbHolder.current.calls, "where")[0].args).toEqual([
      "version",
      "=",
      "33",
    ]);
    expect(callsFor(dbHolder.current.calls, "groupBy")[0].args).toEqual([
      "userId",
    ]);
  });
});

describe("statsPrivacy.getStatsPrivacy", () => {
  it("レコードが存在する場合はその値を返すこと", async () => {
    const row = {
      showArenaClass: 0,
      showArenaRank: 1,
      showArea: 1,
      showGrade: 0,
    };
    dbHolder.current = createDbSpy(row);
    const result = await getStatsPrivacy("user-1");
    expect(result).toEqual(row);
  });

  it("レコードが存在しない場合デフォルト値を返すこと", async () => {
    dbHolder.current = createDbSpy(undefined);
    const result = await getStatsPrivacy("user-1");
    expect(result).toEqual({
      showArenaClass: 1,
      showArenaRank: 0,
      showArea: 0,
      showGrade: 0,
    });
  });
});

describe("statsPrivacy.upsertStatsPrivacy", () => {
  it("デフォルト値と指定settingsをマージしてinsertし、onDuplicateKeyUpdateにはsettingsのみ渡すこと", async () => {
    dbHolder.current = createDbSpy(undefined);
    await upsertStatsPrivacy("user-1", { showArea: 1 });

    const valuesCall = callsFor(dbHolder.current.calls, "values")[0];
    expect(valuesCall.args[0]).toEqual({
      userId: "user-1",
      showArenaClass: 1,
      showArenaRank: 0,
      showArea: 1,
      showGrade: 0,
    });
    expect(
      callsFor(dbHolder.current.calls, "onDuplicateKeyUpdate")[0].args,
    ).toEqual([{ showArea: 1 }]);
  });
});

describe("officialArenaStats.getBestArenaClassPerVersion", () => {
  it("バージョンごとに最上位のアリーナクラスを保持すること", async () => {
    dbHolder.current = createDbSpy([
      { version: "33", arenaClass: "A3", fetchedAt: new Date("2025-06-01") },
      { version: "33", arenaClass: "A1", fetchedAt: new Date("2025-06-02") },
      { version: "32", arenaClass: "B1", fetchedAt: new Date("2025-05-01") },
    ]);

    const result = await getBestArenaClassPerVersion("user-1");

    expect(result.get("33")?.arenaClass).toBe("A1");
    expect(result.get("32")?.arenaClass).toBe("B1");
  });

  it("ARENA_RANK_ORDERに存在しないarenaClassはスキップすること", async () => {
    dbHolder.current = createDbSpy([
      { version: "33", arenaClass: "UNKNOWN", fetchedAt: new Date() },
    ]);
    const result = await getBestArenaClassPerVersion("user-1");
    expect(result.has("33")).toBe(false);
  });
});

describe("officialArenaStats.upsertOfficialArenaStats", () => {
  it("recordsが空の場合、DBに問い合わせず{inserted:0,skipped:0}を返すこと", async () => {
    dbHolder.current = createDbSpy([]);
    const result = await upsertOfficialArenaStats([]);
    expect(result).toEqual({ inserted: 0, skipped: 0 });
    expect(dbHolder.current.calls).toHaveLength(0);
  });

  it("直近と同じfetchedAtのレコードはスキップされること", async () => {
    const fetchedAt = new Date("2025-06-01T00:00:00Z");
    dbHolder.current = createDbSpy([
      {
        userId: "user-1",
        arenaClass: "A1",
        area: "東京都",
        gradeSp: 1,
        gradeDp: 1,
        arenaRank: 5,
        wins: 10,
        a1continue: 2,
        fetchedAt,
      },
    ]);

    const result = await upsertOfficialArenaStats([
      {
        userId: "user-1",
        version: "33",
        arenaClass: "A1",
        area: "東京都",
        gradeSp: 1,
        gradeDp: 1,
        arenaRank: 5,
        wins: 10,
        a1continue: 2,
        fetchedAt,
      } as never,
    ]);

    expect(result).toEqual({ inserted: 0, skipped: 1 });
  });

  it("値に変化があるレコードはinsert対象になること", async () => {
    dbHolder.current = createDbSpy([
      {
        userId: "user-1",
        arenaClass: "A2",
        area: "東京都",
        gradeSp: 1,
        gradeDp: 1,
        arenaRank: 5,
        wins: 10,
        a1continue: 2,
        fetchedAt: new Date("2025-06-01T00:00:00Z"),
      },
    ]);

    const result = await upsertOfficialArenaStats([
      {
        userId: "user-1",
        version: "33",
        arenaClass: "A1", // 変化あり
        area: "東京都",
        gradeSp: 1,
        gradeDp: 1,
        arenaRank: 5,
        wins: 10,
        a1continue: 2,
        fetchedAt: new Date("2025-06-02T00:00:00Z"),
      } as never,
    ]);

    expect(result).toEqual({ inserted: 1, skipped: 0 });
  });
});

describe("officialArenaStats.getLatestArenaStatsPerVersion / getArenaStatsHistory", () => {
  it("getLatestArenaStatsPerVersionはuserIdで検索すること", async () => {
    const rows = [{ arenaClass: "A1", version: "33" }];
    dbHolder.current = createDbSpy(rows);
    const result = await getLatestArenaStatsPerVersion("user-1");
    expect(result).toEqual(rows);
  });

  it("getArenaStatsHistoryは期間で絞り込むこと", async () => {
    dbHolder.current = createDbSpy([]);
    await getArenaStatsHistory(
      "user-1",
      "33",
      new Date("2025-06-01"),
      new Date("2025-06-30"),
    );
    expect(callsFor(dbHolder.current.calls, "where")).toHaveLength(4);
  });
});
