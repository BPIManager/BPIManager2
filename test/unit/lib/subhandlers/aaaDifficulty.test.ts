import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleStatsAaaDifficulty } from "@/lib/subhandlers/stats/aaaDifficulty";

const getAAATableDataMock = vi.fn();

vi.mock("@/lib/db/aggregates/stats/tables", () => ({
  statsTablesRepo: {
    getAAATableData: (...a: unknown[]) => getAAATableDataMock(...a),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("handleStatsAaaDifficulty", () => {
  it("mu/sigmaを含む譜面はtargetBpi/user.bpiが床(-15)に落ちないこと", async () => {
    // songDefのmu/sigma/residualVarを取得し損ねると、BpiCalculator.calc(V2)が
    // 常にnullを返し、全てのBPIが -15 にフォールバックしてしまう回帰を防ぐ。
    getAAATableDataMock.mockResolvedValue([
      {
        songId: 1,
        title: "TEST SONG",
        difficulty: "ANOTHER",
        notes: 1000,
        releasedVersion: 30,
        wrScore: 1900,
        kaidenAvg: 1500,
        coef: 1.175,
        mu: -3.5,
        sigma: 0.6,
        residualVar: 0.05,
        userExScore: 1850,
        userBpi: 30,
      },
    ]);

    const result = await handleStatsAaaDifficulty({
      userId: "u1",
      version: "33",
      level: 12,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const [song] = result.body as {
      targets: {
        aaa: { targetBpi: number };
        maxMinus: { targetBpi: number };
      };
      user: { bpi: number };
    }[];

    expect(song.targets.aaa.targetBpi).not.toBe(-15);
    expect(song.targets.maxMinus.targetBpi).not.toBe(-15);
    expect(song.user.bpi).not.toBe(-15);
  });

  it("mu/sigmaが無い譜面(V2対象外)はBPIが床(-15)のままであること", async () => {
    getAAATableDataMock.mockResolvedValue([
      {
        songId: 2,
        title: "NO PARAM SONG",
        difficulty: "ANOTHER",
        notes: 1000,
        releasedVersion: 30,
        wrScore: 1900,
        kaidenAvg: 1500,
        coef: 1.175,
        mu: null,
        sigma: null,
        residualVar: null,
        userExScore: 1850,
        userBpi: 30,
      },
    ]);

    const result = await handleStatsAaaDifficulty({
      userId: "u1",
      version: "33",
      level: 12,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const [song] = result.body as {
      targets: { aaa: { targetBpi: number } };
      user: { bpi: number };
    }[];

    expect(song.targets.aaa.targetBpi).toBe(-15);
    expect(song.user.bpi).toBe(-15);
  });
});
