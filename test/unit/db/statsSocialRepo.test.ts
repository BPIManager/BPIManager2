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

const { statsSocialRepo } = await import("@/lib/db/aggregates/stats/social");

describe("statsSocialRepo.getNeighborIds", () => {
  it("userIdの配列を返すこと", async () => {
    dbHolder.current = createDbSpy([
      { userId: "user-a" },
      { userId: "user-b" },
    ]);
    const result = await statsSocialRepo.getNeighborIds(30, "user-1", "33", 5);
    expect(result).toEqual(["user-a", "user-b"]);
    expect(callsFor(dbHolder.current.calls, "limit")[0].args).toEqual([5]);
  });
});

describe("statsSocialRepo.getNeighborScoreComparison", () => {
  it("neighborIdsが空の場合、DBに問い合わせず空配列を返すこと", async () => {
    dbHolder.current = createDbSpy([]);
    const result = await statsSocialRepo.getNeighborScoreComparison(
      "user-1",
      [],
      "33",
    );
    expect(result).toEqual([]);
    expect(dbHolder.current.calls).toHaveLength(0);
  });
});
