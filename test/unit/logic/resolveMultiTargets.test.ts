import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SongWithScore, SongWithRival } from "@/types/songs/score";
import type { AnalyticsTarget } from "@/types/analytics";

const mockAuthFetch = vi.fn();

vi.mock("@/utils/common/fetch", () => ({
  authFetch: (...args: unknown[]) => mockAuthFetch(...args),
  fetcher: vi.fn(),
}));

const { resolveTarget, songKey, targetKey } = await import(
  "@/hooks/analytics/resolveMultiTargets"
);

function buildScore(overrides: Partial<SongWithScore> = {}): SongWithScore {
  return {
    songId: 1,
    title: "冥",
    bpm: "200",
    difficulty: "ANOTHER",
    difficultyLevel: 12,
    releasedVersion: 27,
    notes: 1000,
    kaidenAvg: 1500,
    wrScore: 1900,
    coef: 1.175,
    logId: 1,
    exScore: 1800,
    bpi: 10,
    clearState: "HARD CLEAR",
    missCount: 3,
    scoreAt: null,
    ...overrides,
  };
}

describe("songKey/targetKey", () => {
  it("songKeyはtitle__difficultyの形式であること", () => {
    expect(songKey({ title: "冥", difficulty: "ANOTHER" })).toBe("冥__ANOTHER");
  });

  it("targetKeyはparamの有無でkindのみ/kind:paramを区別すること", () => {
    expect(targetKey({ kind: "wr", label: "WR" })).toBe("wr:");
    expect(
      targetKey({ kind: "rival", param: "user-1", label: "太郎" }),
    ).toBe("rival:user-1");
  });
});

describe("resolveTarget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });


  it("kind=aaaの場合、myScoresからAAA達成に必要なEXを算出すること(fetch不要)", async () => {
    const target: AnalyticsTarget = { kind: "aaa", label: "AAA" };
    const myScores = [buildScore({ notes: 1000 })];

    const map = await resolveTarget("user-1", target, "33", myScores, null);

    expect(mockAuthFetch).not.toHaveBeenCalled();
    const value = map.get("冥__ANOTHER");
    expect(value?.exScore).toBe(Math.ceil(2000 * (8 / 9)));
  });

  it("kind=wrの場合、myScoresのwrScoreをそのまま使うこと", async () => {
    const target: AnalyticsTarget = { kind: "wr", label: "WR" };
    const myScores = [buildScore({ wrScore: 1950 })];

    const map = await resolveTarget("user-1", target, "33", myScores, null);

    expect(map.get("冥__ANOTHER")?.exScore).toBe(1950);
  });

  it("kind=rivalの場合、対応するAPIから取得しrivalのEX/BPIだけをマップに詰めること", async () => {
    const target: AnalyticsTarget = {
      kind: "rival",
      param: "rival-1",
      label: "ライバル太郎",
    };
    const rivalRows: SongWithRival[] = [
      {
        ...buildScore(),
        rival: {
          exScore: 1750,
          bpi: 8,
          clearState: "CLEAR",
          missCount: 5,
          lastPlayed: null,
        },
      },
    ];
    mockAuthFetch.mockResolvedValue({
      ok: true,
      json: async () => rivalRows,
    });

    const map = await resolveTarget("user-1", target, "33", [], null);

    expect(mockAuthFetch).toHaveBeenCalledWith(
      expect.stringContaining("/users/user-1/rivals/rival-1/scores?version=33"),
      "GET",
      null,
    );
    expect(map.get("冥__ANOTHER")).toEqual({ exScore: 1750, bpi: 8 });
  });

  it("param必須のkindでparam未指定の場合、fetchせず空マップを返すこと", async () => {
    const target: AnalyticsTarget = { kind: "rival", label: "未指定" };

    const map = await resolveTarget("user-1", target, "33", [], null);

    expect(mockAuthFetch).not.toHaveBeenCalled();
    expect(map.size).toBe(0);
  });
});
