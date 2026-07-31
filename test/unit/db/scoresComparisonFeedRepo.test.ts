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

const { socialTimelineRepo } = await import("@/lib/db/scores/feed");
const { socialComparisonRepo } = await import("@/lib/db/scores/comparison");

describe("socialTimelineRepo.getFollowedTimeline", () => {
  it("search/levels/difficulties/lastIdを指定すると対応する$ifがtrueになること", async () => {
    dbHolder.current = createDbSpy([]);
    await socialTimelineRepo.getFollowedTimeline({
      viewerId: "user-1",
      version: "33",
      limit: 20,
      search: "冥",
      levels: [12],
      difficulties: ["ANOTHER"],
      lastId: "2025-06-01T00:00:00Z",
      mode: "played",
    });

    const ifCalls = callsFor(dbHolder.current.calls, "$if");
    // 順序: search, levels, difficulties, mode=played, mode=overtaken, lastId
    expect(ifCalls.map((c) => c.args[0])).toEqual([
      true,
      true,
      true,
      true,
      false,
      true,
    ]);
  });

  it("何も指定しない場合すべての$ifがfalseになること", async () => {
    dbHolder.current = createDbSpy([]);
    await socialTimelineRepo.getFollowedTimeline({
      viewerId: "user-1",
      version: "33",
      limit: 20,
    });

    const ifCalls = callsFor(dbHolder.current.calls, "$if");
    expect(ifCalls.every((c) => c.args[0] === false)).toBe(true);
  });

  it("mode=overtakenのとき該当$ifのみtrueになること", async () => {
    dbHolder.current = createDbSpy([]);
    await socialTimelineRepo.getFollowedTimeline({
      viewerId: "user-1",
      version: "33",
      limit: 20,
      mode: "overtaken",
    });
    const ifCalls = callsFor(dbHolder.current.calls, "$if");
    expect(ifCalls[3].args[0]).toBe(false); // played
    expect(ifCalls[4].args[0]).toBe(true); // overtaken
  });
});

describe("socialTimelineRepo.getViewerScoresForSongs", () => {
  it("songIdsが空の場合、DBに問い合わせず空配列を返すこと", async () => {
    dbHolder.current = createDbSpy([]);
    const result = await socialTimelineRepo.getViewerScoresForSongs(
      "user-1",
      "33",
      [],
    );
    expect(result).toEqual([]);
    expect(dbHolder.current.calls).toHaveLength(0);
  });
});

describe("socialComparisonRepo.getWinLossStats", () => {
  it("行データを数値化して返すこと", async () => {
    dbHolder.current = createDbSpy([
      { level: 12, win: "5", lose: "3", draw: "1" },
    ]);
    const result = await socialComparisonRepo.getWinLossStats(
      "viewer-1",
      "rival-1",
      "33",
    );
    expect(result).toEqual([{ level: 12, win: 5, lose: 3, draw: 1 }]);
  });
});

describe("socialComparisonRepo.getUserRadar", () => {
  it("userId/versionでuserRadarCacheを検索すること", async () => {
    const row = { userId: "user-1", version: "33", notes: 10 };
    dbHolder.current = createDbSpy(row);
    const result = await socialComparisonRepo.getUserRadar("user-1", "33");
    expect(result).toEqual(row);
  });
});

describe("socialComparisonRepo.getWinLossHistory", () => {
  it("対象レベルの楽曲が存在しない場合、空配列を返すこと", async () => {
    dbHolder.current = createDbSpy([]);
    const result = await socialComparisonRepo.getWinLossHistory(
      "viewer-1",
      "rival-1",
      "33",
      12,
    );
    expect(result).toEqual([]);
  });
});

describe("socialComparisonRepo.getFollowedWinLossSummary", () => {
  it("levels/difficultiesを指定すると対応する$ifがtrueになること", async () => {
    dbHolder.current = createDbSpy([]);
    await socialComparisonRepo.getFollowedWinLossSummary({
      viewerId: "user-1",
      version: "33",
      levels: [12],
      difficulties: ["ANOTHER"],
    });
    const ifCalls = callsFor(dbHolder.current.calls, "$if");
    expect(ifCalls[0].args[0]).toBe(true);
    expect(ifCalls[1].args[0]).toBe(true);
  });

  it("結果行をradar/viewerRadar/stats構造にマッピングすること", async () => {
    dbHolder.current = createDbSpy([
      {
        userId: "rival-1",
        userName: "ライバル",
        profileImage: null,
        iidxId: "1234-5678",
        arenaClass: "A1",
        totalBpi: "35.5",
        r_notes: 10,
        r_chord: 20,
        r_peak: 30,
        r_charge: 40,
        r_scratch: 50,
        r_soflan: 60,
        v_notes: 1,
        v_chord: 2,
        v_peak: 3,
        v_charge: 4,
        v_scratch: 5,
        v_soflan: 6,
        ur_role: "iidx",
        ur_description: "説明",
        ur_grantedAt: "2025-01-01",
        usl_updatedAt: "2025-06-01",
        win: "3",
        lose: "1",
        draw: "0",
        totalCount: "4",
      },
    ]);

    const [result] = await socialComparisonRepo.getFollowedWinLossSummary({
      viewerId: "user-1",
      version: "33",
      levels: [],
      difficulties: [],
    });

    expect(result.totalBpi).toBe(35.5);
    expect(result.radar).toEqual({
      notes: 10,
      chord: 20,
      peak: 30,
      charge: 40,
      scratch: 50,
      soflan: 60,
    });
    expect(result.stats).toEqual({ win: 3, lose: 1, draw: 0, totalCount: 4 });
    expect(result.role).toEqual({
      role: "iidx",
      description: "説明",
      grantedAt: "2025-01-01",
    });
  });

  it("roleがない場合nullになり、totalBpiがない場合nullになること", async () => {
    dbHolder.current = createDbSpy([
      {
        userId: "rival-1",
        userName: "ライバル",
        profileImage: null,
        iidxId: null,
        arenaClass: null,
        totalBpi: null,
        r_notes: 0,
        r_chord: 0,
        r_peak: 0,
        r_charge: 0,
        r_scratch: 0,
        r_soflan: 0,
        v_notes: 0,
        v_chord: 0,
        v_peak: 0,
        v_charge: 0,
        v_scratch: 0,
        v_soflan: 0,
        ur_role: null,
        ur_description: null,
        ur_grantedAt: null,
        usl_updatedAt: null,
        win: "0",
        lose: "0",
        draw: "0",
        totalCount: "0",
      },
    ]);

    const [result] = await socialComparisonRepo.getFollowedWinLossSummary({
      viewerId: "user-1",
      version: "33",
      levels: [],
      difficulties: [],
    });

    expect(result.totalBpi).toBeNull();
    expect(result.role).toBeNull();
    expect(result.lastUpdated).toBeNull();
  });
});
