// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAnalyticsComparison } from "@/hooks/analytics/useAnalyticsComparison";
import type { SongWithScore } from "@/types/songs/score";
import type { AnalyticsTarget } from "@/types/analytics";

const mockUseUser = vi.fn();
const mockUseAuthedSWR = vi.fn();
const mockUseRivalAvgScores = vi.fn();
const mockUseRivalTopScores = vi.fn();
const mockUseArenaJson = vi.fn();

vi.mock("@/contexts/users/UserContext", () => ({
  useUser: () => mockUseUser(),
}));

vi.mock("@/hooks/common/useAuthedSWRV2", () => ({
  useAuthedSWRV2: (url: string | null, options?: unknown) =>
    mockUseAuthedSWR(url, options),
}));

vi.mock("@/hooks/analytics/useComparisonSources", () => ({
  useRivalAvgScores: (userId: string | undefined, version: string) =>
    mockUseRivalAvgScores(userId, version),
  useRivalTopScores: (userId: string | undefined, version: string) =>
    mockUseRivalTopScores(userId, version),
  useArenaJson: (version: string, levels: number[]) =>
    mockUseArenaJson(version, levels),
}));

function buildScore(overrides: Partial<SongWithScore> = {}): SongWithScore {
  return {
    songId: 1,
    title: "TEST SONG",
    bpm: "150",
    difficulty: "LEAVEN",
    difficultyLevel: 12,
    releasedVersion: 30,
    notes: 1000,
    kaidenAvg: 1900,
    wrScore: 1980,
    coef: 1.05,
    logId: 1,
    exScore: 1800,
    bpi: 50,
    clearState: "HARD",
    missCount: 3,
    scoreAt: null,
    ...overrides,
  };
}

const EMPTY_SWR = { data: undefined, error: undefined, isLoading: false };

beforeEach(() => {
  vi.clearAllMocks();
  mockUseUser.mockReturnValue({ user: { userId: "u1" }, fbUser: { uid: "u1" } });
  mockUseAuthedSWR.mockReturnValue(EMPTY_SWR);
  mockUseRivalAvgScores.mockReturnValue(EMPTY_SWR);
  mockUseRivalTopScores.mockReturnValue(EMPTY_SWR);
  mockUseArenaJson.mockReturnValue({ rows: [], isLoading: false });
});

describe("useAnalyticsComparison", () => {
  it("targetがnullの場合は何もフェッチせず空のレスポンスを返すこと", () => {
    const { result } = renderHook(() => useAnalyticsComparison(null));

    expect(result.current).toEqual({
      songs: undefined,
      isLoading: false,
      error: undefined,
      rivalLabel: "",
    });
    expect(mockUseAuthedSWR).not.toHaveBeenCalledWith(
      expect.stringContaining("rivals"),
      expect.anything(),
    );
  });

  it("kind=rivalの場合、ライバルスコアAPIの結果をそのまま返すこと", () => {
    const target: AnalyticsTarget = { kind: "rival", param: "r1", label: "R" };
    const rivalSongs = [buildScore()];
    mockUseAuthedSWR.mockImplementation((url: string | null) => {
      if (url?.includes("/rivals/r1/scores")) {
        return { data: rivalSongs, error: undefined, isLoading: false };
      }
      return EMPTY_SWR;
    });

    const { result } = renderHook(() => useAnalyticsComparison(target));

    expect(result.current.songs).toBe(rivalSongs);
    expect(result.current.rivalLabel).toBe("R");
    expect(result.current.isLoading).toBe(false);
  });

  it("kind=self-bestの場合、best-everとmyScoresをsongId+difficultyでマージすること", () => {
    const target: AnalyticsTarget = { kind: "self-best", label: "自己ベスト" };
    const myScores = [buildScore({ songId: 1, difficulty: "LEAVEN", exScore: 1800 })];
    const bestEver = [
      {
        songId: 1,
        title: "TEST SONG",
        difficulty: "LEAVEN",
        difficultyLevel: 12,
        notes: 1000,
        bpm: "150",
        releasedVersion: 30,
        bestExScore: 1900,
        bestBpi: 55,
        bestVersion: "29",
        wrScore: 1980,
        kaidenAvg: 1900,
        coef: 1.05,
      },
    ];
    mockUseAuthedSWR.mockImplementation((url: string | null) => {
      if (url?.includes("/scores/best-ever")) {
        return { data: bestEver, error: undefined, isLoading: false };
      }
      if (url?.includes("/scores?version=")) {
        return { data: myScores, error: undefined, isLoading: false };
      }
      return EMPTY_SWR;
    });

    const { result } = renderHook(() => useAnalyticsComparison(target));

    expect(result.current.songs).toHaveLength(1);
    expect(result.current.songs?.[0].rival.exScore).toBe(1900);
    expect(result.current.songs?.[0].rival.bpi).toBe(55);
    expect(result.current.songs?.[0].exDiff).toBe(1800 - 1900);
  });

  it("kind=aaaの場合、notesから算出したAAAターゲットEXスコアをマージすること", () => {
    const target: AnalyticsTarget = { kind: "aaa", label: "AAA" };
    const myScores = [buildScore({ notes: 1000, exScore: 1700 })];
    mockUseAuthedSWR.mockReturnValue({
      data: myScores,
      error: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useAnalyticsComparison(target));

    const expectedEx = Math.ceil(1000 * 2 * (8 / 9));
    expect(result.current.songs?.[0].rival.exScore).toBe(expectedEx);
  });

  it("kind=arenaの場合、同名同難易度で複数songIdが存在する曲はアリーナ突合をスキップすること", () => {
    const target: AnalyticsTarget = { kind: "arena", param: "A1", label: "Arena" };
    const myScores = [
      buildScore({ songId: 1, title: "DUP", difficulty: "LEAVEN" }),
      buildScore({ songId: 2, title: "DUP", difficulty: "LEAVEN" }),
    ];
    mockUseAuthedSWR.mockReturnValue({
      data: myScores,
      error: undefined,
      isLoading: false,
    });
    mockUseArenaJson.mockReturnValue({
      rows: [
        {
          title: "DUP",
          difficulty: "LEAVEN",
          notes: 1000,
          maxScore: 2000,
          averages: { A1: { avgExScore: 1850, rate: 0.9, count: 10, avgBpi: 40 } },
        },
      ],
      isLoading: false,
    });

    const { result } = renderHook(() => useAnalyticsComparison(target));

    expect(result.current.songs?.every((s) => s.rival.exScore === null)).toBe(
      true,
    );
  });

  it("myScoresのロード中はisLoading=trueで何も返さないこと", () => {
    const target: AnalyticsTarget = { kind: "aaa", label: "AAA" };
    mockUseAuthedSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    });

    const { result } = renderHook(() => useAnalyticsComparison(target));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.songs).toBeUndefined();
  });
});
