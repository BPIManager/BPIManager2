import { describe, it, expect, vi } from "vitest";
import { createDbSpy, callsFor } from "./helpers/dbQuerySpy";

const { dbHolder } = vi.hoisted(() => ({
  dbHolder: { current: null as ReturnType<typeof import("./helpers/dbQuerySpy")["createDbSpy"]> | null },
}));

vi.mock("@/lib/db", () => ({
  get db() {
    return dbHolder.current!.db;
  },
}));

const { ticketsRepo } = await import("@/lib/db/tickets");

describe("ticketsRepo.getLatestTotalBpi", () => {
  it("結果がある場合数値化して返すこと", async () => {
    dbHolder.current = createDbSpy({ totalBpi: "35.5" });
    const result = await ticketsRepo.getLatestTotalBpi("user-1", "33");
    expect(result).toBe(35.5);
  });

  it("結果がない場合nullを返すこと", async () => {
    dbHolder.current = createDbSpy(undefined);
    const result = await ticketsRepo.getLatestTotalBpi("user-1", "33");
    expect(result).toBeNull();
  });
});

describe("ticketsRepo.getTopSongsForTicket", () => {
  const makeRow = (songId: number, patternScore: number) => ({
    songId,
    patternScore,
    title: `曲${songId}`,
    difficulty: "ANOTHER",
    difficultyLevel: 12,
    notes: 1000,
    bpm: "200",
    textage: null,
    exScore: 1800,
    bpi: "30",
    clearState: "HARD CLEAR",
    maxPatternScore: 100,
    upvoteCount: "2",
    downvoteCount: "1",
    myVote: null,
    g_scratch: "10",
    g_soflan: null,
    g_cn: null,
    g_chord: null,
    g_intensity: null,
    g_delay: null,
    g_tateren: null,
    g_trill_denim: null,
    g_peak: null,
  });

  it("PAGE_SIZE+1件返ってきた場合、10件に切り詰めhasMoreがtrueになること", async () => {
    const rows = Array.from({ length: 11 }, (_, i) => makeRow(i, i));
    dbHolder.current = createDbSpy(rows);

    const result = await ticketsRepo.getTopSongsForTicket(
      "1234567",
      "user-1",
      "33",
      30,
    );

    expect(result.items).toHaveLength(10);
    expect(result.hasMore).toBe(true);
  });

  it("relativeScoreをmaxPatternScoreに対する百分率で計算すること", async () => {
    dbHolder.current = createDbSpy([makeRow(1, 50)]);
    const result = await ticketsRepo.getTopSongsForTicket(
      "1234567",
      "user-1",
      "33",
      30,
    );
    expect(result.items[0].relativeScore).toBe(50);
  });

  it("maxPatternScoreが0の場合relativeScoreは0になること", async () => {
    const row = { ...makeRow(1, 50), maxPatternScore: 0 };
    dbHolder.current = createDbSpy([row]);
    const result = await ticketsRepo.getTopSongsForTicket(
      "1234567",
      "user-1",
      "33",
      30,
    );
    expect(result.items[0].relativeScore).toBe(0);
  });

  it("bpiGapはtotalBpiと曲bpiの差になること", async () => {
    dbHolder.current = createDbSpy([makeRow(1, 50)]);
    const result = await ticketsRepo.getTopSongsForTicket(
      "1234567",
      "user-1",
      "33",
      35,
    );
    expect(result.items[0].bpiGap).toBe(5);
  });

  it("totalBpiがnullの場合bpiGapはnullになること", async () => {
    dbHolder.current = createDbSpy([makeRow(1, 50)]);
    const result = await ticketsRepo.getTopSongsForTicket(
      "1234567",
      "user-1",
      "33",
      null,
    );
    expect(result.items[0].bpiGap).toBeNull();
  });

  it("scoreMode='raw'の場合sp.scoreを直接ソート基準にすること", async () => {
    dbHolder.current = createDbSpy([]);
    await ticketsRepo.getTopSongsForTicket(
      "1234567",
      "user-1",
      "33",
      null,
      0,
      "raw",
    );
    expect(callsFor(dbHolder.current.calls, "orderBy")).toHaveLength(1);
  });

  it("offsetが適用されること", async () => {
    dbHolder.current = createDbSpy([]);
    await ticketsRepo.getTopSongsForTicket(
      "1234567",
      "user-1",
      "33",
      null,
      20,
    );
    expect(callsFor(dbHolder.current.calls, "offset")[0].args).toEqual([20]);
  });
});
