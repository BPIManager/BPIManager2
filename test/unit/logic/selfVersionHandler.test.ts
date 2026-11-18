import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/db/domains/scores/timeline", () => ({
  timelineRepo: {
    getSelfVersionScores: vi.fn(async () => [
      {
        songId: 1,
        title: "A",
        notes: 1000,
        bpm: "150",
        difficulty: "ANOTHER",
        difficultyLevel: 12,
        releasedVersion: 33,
        myExScore: 1800,
        myBpi: 20,
        myClearState: "CLEAR",
        myMissCount: 5,
        myLastPlayed: null,
        prevExScore: 1700,
        prevBpi: 10,
        prevClearState: "CLEAR",
        prevMissCount: 8,
        prevLastPlayed: null,
        wrScore: 1990,
        kaidenAvg: 1500,
        coef: 1.2,
        mu: 0.5,
        sigma: 0.3,
        residualVar: 0.04,
      },
    ]),
  },
}));

import { handleSelfVersion } from "@/lib/subhandlers/scores/selfVersion";

describe("handleSelfVersion", () => {
  it("比較先のBPI計算に必要な譜面の mu / sigma / residualVar をレスポンスに含める", async () => {
    const req = {
      query: { userId: "u1", currentVersion: "34", targetVersion: "33" },
    } as never;
    const { result } = await handleSelfVersion(req, { viewerId: "u1" } as never);

    const body = (result as { body: Record<string, unknown>[] }).body;
    expect(body[0]).toMatchObject({
      coef: 1.2,
      mu: 0.5,
      sigma: 0.3,
      residualVar: 0.04,
    });
  });
});
