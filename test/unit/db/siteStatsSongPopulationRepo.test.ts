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

const { siteStatsSongPopulationRepo } = await import(
  "@/lib/db/aggregates/siteStats/songPopulation"
);

describe("siteStatsSongPopulationRepo.getSongPopulationPage", () => {
  it("orderがtopの場合desc、bottomの場合ascでソートすること", async () => {
    dbHolder.current = createDbSpy([
      { songId: 1, title: "冥", difficulty: "ANOTHER", playerCount: "100" },
    ]);
    const result = await siteStatsSongPopulationRepo.getSongPopulationPage(
      "top",
      0,
      20,
    );
    expect(result).toEqual([
      { songId: 1, title: "冥", difficulty: "ANOTHER", playerCount: 100 },
    ]);
  });
});

describe("siteStatsSongPopulationRepo.getSongPopulationTotal", () => {
  it("楽曲総数を数値で返すこと", async () => {
    dbHolder.current = createDbSpy({ count: "500" });
    const result = await siteStatsSongPopulationRepo.getSongPopulationTotal();
    expect(result).toBe(500);
  });

  it("結果がundefinedの場合0を返すこと", async () => {
    dbHolder.current = createDbSpy(undefined);
    const result = await siteStatsSongPopulationRepo.getSongPopulationTotal();
    expect(result).toBe(0);
  });
});
