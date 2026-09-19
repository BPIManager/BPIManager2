import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextApiRequest } from "next";
import { BpiCalculator } from "@/lib/bpi";
import type { OptimizationResult } from "@/types/bpi-optimizer";

const getAllSongsWithSelfBestScoresMock = vi.fn();
const getAllSongsWithUserScoresMock = vi.fn();
const findOptimalBpiPathMock = vi.fn();

vi.mock("@/lib/db/aggregates/bpiOptimizer", () => ({
  bpiOptimizerAggregateRepo: {
    getAllSongsWithSelfBestScores: (...a: unknown[]) =>
      getAllSongsWithSelfBestScoresMock(...a),
    getAllSongsWithUserScores: (...a: unknown[]) =>
      getAllSongsWithUserScoresMock(...a),
  },
}));

vi.mock("@/lib/bpi/optimizer", () => ({
  findOptimalBpiPath: (...a: unknown[]) => findOptimalBpiPathMock(...a),
}));

const { handleBpiOptimizer } = await import(
  "@/lib/subhandlers/bpiOptimizer/optimizer"
);

const FIXTURE_MU = -5.521460917862246;
const FIXTURE_SIGMA = 0.3157160805385319;

const SONG_DATA = {
  notes: 1000,
  kaidenAvg: 1750,
  wrScore: 1980,
  coef: 1,
  mu: FIXTURE_MU,
  sigma: FIXTURE_SIGMA,
  residualVar: null,
};

function makeRow(songId: number, exScore: number | null) {
  return {
    songId,
    title: `曲${songId}`,
    notes: SONG_DATA.notes,
    difficulty: "ANOTHER",
    difficultyLevel: 12,
    wrScore: SONG_DATA.wrScore,
    kaidenAvg: SONG_DATA.kaidenAvg,
    coef: SONG_DATA.coef,
    mu: SONG_DATA.mu,
    sigma: SONG_DATA.sigma,
    residualVar: SONG_DATA.residualVar,
    exScore,
  };
}

function makeReq(query: Record<string, string>, userId = "user-1") {
  return {
    query: { userId, targetBpi: "50", ...query },
  } as unknown as NextApiRequest;
}

function bodyOf(result: { ok: boolean; body?: unknown }): OptimizationResult {
  return result.body as OptimizationResult;
}

function stubEngineResult(overrides: Partial<OptimizationResult> = {}) {
  const result: OptimizationResult = {
    steps: [
      {
        rank: 1,
        songId: 1,
        title: "曲1",
        difficulty: "ANOTHER",
        difficultyLevel: 12,
        notes: SONG_DATA.notes,
        fromBpi: 12.3,
        toBpi: 20,
        fromExScore: 1900,
        toExScore: 1950,
        exScoreGap: 50,
        bpiGain: 1.5,
        cumulativeTotalBpi: 30,
        isUnplayed: false,
        radarCategory: null,
        isRadarStrength: false,
      },
    ],
    currentTotalBpi: 28.5,
    targetTotalBpi: 50,
    achievable: true,
    alreadyAchieved: false,
    totalSongCount: 2,
    ...overrides,
  };
  findOptimalBpiPathMock.mockReturnValue(result);
  return result;
}

beforeEach(() => {
  getAllSongsWithSelfBestScoresMock.mockReset();
  getAllSongsWithUserScoresMock.mockReset();
  findOptimalBpiPathMock.mockReset();
});

describe("handleBpiOptimizer / 自己べ・過去バージョンデータセット時の登録当初スコア", () => {
  it("自己べデータセットで探索した場合、保存されるfromExScoreは今作現在スコアに置き換わること", async () => {
    getAllSongsWithSelfBestScoresMock.mockResolvedValue([
      makeRow(1, 1900),
      makeRow(2, 1800),
    ]);
    getAllSongsWithUserScoresMock.mockResolvedValue([
      makeRow(1, 1700),
      makeRow(2, 1800),
    ]);
    stubEngineResult();

    const { result } = await handleBpiOptimizer(
      makeReq({ datasetVersion: "self-best" }),
      {},
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const step = bodyOf(result).steps[0];
    expect(step.fromExScore).toBe(1700);
    expect(step.fromBpi).toBeCloseTo(BpiCalculator.calc(1700, SONG_DATA)!, 6);
    expect(step.exScoreGap).toBe(step.toExScore - 1700);
    expect(step.isUnplayed).toBe(false);
    // 探索の軌跡自体（目標側）は変更しない
    expect(step.toExScore).toBe(1950);
    expect(step.toBpi).toBe(20);
    expect(step.bpiGain).toBe(1.5);
    expect(step.cumulativeTotalBpi).toBe(30);

    // 実データ取得は自己べデータセットと今作現在データセットの2回呼ばれる
    expect(getAllSongsWithSelfBestScoresMock).toHaveBeenCalledTimes(1);
    expect(getAllSongsWithUserScoresMock).toHaveBeenCalledTimes(1);
  });

  it("自己べはあるが今作では未プレイの曲は、fromExScoreがnull・isUnplayedがtrueになること", async () => {
    getAllSongsWithSelfBestScoresMock.mockResolvedValue([
      makeRow(1, 1900),
      makeRow(2, 1800),
    ]);
    getAllSongsWithUserScoresMock.mockResolvedValue([
      makeRow(1, null),
      makeRow(2, 1800),
    ]);
    stubEngineResult();

    const { result } = await handleBpiOptimizer(
      makeReq({ datasetVersion: "self-best" }),
      {},
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const step = bodyOf(result).steps[0];
    expect(step.fromExScore).toBeNull();
    expect(step.fromBpi).toBe(-15);
    expect(step.exScoreGap).toBe(step.toExScore);
    expect(step.isUnplayed).toBe(true);
  });

  it("今作(最新バージョン)のデータセットで探索した場合は、fromExScoreを上書きせず今作現在スコアの再取得も行わないこと", async () => {
    getAllSongsWithUserScoresMock.mockResolvedValue([
      makeRow(1, 1900),
      makeRow(2, 1800),
    ]);
    stubEngineResult();

    const { result } = await handleBpiOptimizer(makeReq({}), {});

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(bodyOf(result).steps[0].fromExScore).toBe(1900);
    expect(getAllSongsWithSelfBestScoresMock).not.toHaveBeenCalled();
    // 今作データセット自体の取得は探索用の1回のみ（baseline再取得は発生しない）
    expect(getAllSongsWithUserScoresMock).toHaveBeenCalledTimes(1);
  });
});
