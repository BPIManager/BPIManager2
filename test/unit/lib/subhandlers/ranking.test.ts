import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AuthenticatedNextApiRequest } from "@/middlewares/api/withAuth";
import {
  handleGlobalRanking,
  handleRankingSongById,
  handleUserSongRankings,
  handleTowerRanking,
} from "@/lib/subhandlers/ranking";

const getGlobalRankingMock = vi.fn();
const getForUserAndVersionMock = vi.fn();
const getSongRankingMock = vi.fn();
const getUserSongRankingsMock = vi.fn();
const getTowerRankingMock = vi.fn();
const getLatestScoresWithMusicDataMock = vi.fn();

vi.mock("@/lib/db/aggregates/userProfiles/ranking", () => ({
  userRankingRepo: {
    getGlobalRanking: (...a: unknown[]) => getGlobalRankingMock(...a),
  },
}));
vi.mock("@/lib/db/domains/radar", () => ({
  radarCacheRepo: {
    getForUserAndVersion: (...a: unknown[]) => getForUserAndVersionMock(...a),
  },
}));
vi.mock("@/lib/db/aggregates/stats/tables", () => ({
  statsTablesRepo: {
    getSongRanking: (...a: unknown[]) => getSongRankingMock(...a),
    getUserSongRankings: (...a: unknown[]) => getUserSongRankingsMock(...a),
    getLatestScoresWithMusicData: (...a: unknown[]) =>
      getLatestScoresWithMusicDataMock(...a),
  },
}));
vi.mock("@/lib/db/aggregates/iidxTower", () => ({
  iidxTowerAggregateRepo: {
    getTowerRanking: (...a: unknown[]) => getTowerRankingMock(...a),
  },
}));
vi.mock("@/lib/db/shared/visibility", () => ({
  canViewUserData: (p: { isPublic?: number }) => p.isPublic === 1,
}));
vi.mock("@/lib/db/shared/privacyMask", () => ({
  maskPrivateIdentity: (p: {
    isPublic: number;
    userId: string;
    userName: string;
    profileImage: string | null;
    anonId: string;
  }) =>
    p.isPublic === 1
      ? { userId: p.userId, userName: p.userName, profileImage: p.profileImage }
      : { userId: p.anonId, userName: "非公開ユーザー", profileImage: null },
}));
vi.mock("@/lib/radar/calculator", () => ({
  calculateRadar: () => ({ NOTES: { totalBpi: 0, songs: [] } }),
}));

const authReq = (query: Record<string, unknown>) =>
  ({ query, authUid: "me" }) as unknown as AuthenticatedNextApiRequest;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("handleRankingSongById", () => {
  it("songId が数値でなければ err(400)", async () => {
    const { result } = await handleRankingSongById(authReq({ songId: "x" }));
    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it("正常時は viewerId=authUid で取得し ok / meta 情報を返す", async () => {
    getSongRankingMock.mockResolvedValue({ rows: [1] });
    const { result, viewerId, targetUserId } = await handleRankingSongById(
      authReq({ songId: "5", userId: "me", version: "31" }),
    );
    expect(result).toEqual({ ok: true, body: { rows: [1] } });
    expect(viewerId).toBe("me");
    expect(targetUserId).toBe("me");
    expect(getSongRankingMock).toHaveBeenCalledWith(5, "31", "me");
  });

  it("リポジトリが投げたら err(500)", async () => {
    getSongRankingMock.mockRejectedValue(new Error("boom"));
    const { result } = await handleRankingSongById(authReq({ songId: "5" }));
    expect(result).toEqual({ ok: false, status: 500, message: "boom" });
  });
});

describe("handleUserSongRankings", () => {
  it("{ songs } でラップして ok", async () => {
    getUserSongRankingsMock.mockResolvedValue([{ songId: 1 }]);
    const { result } = await handleUserSongRankings(authReq({ version: "31" }));
    expect(result).toEqual({ ok: true, body: { songs: [{ songId: 1 }] } });
  });

  it("不正な version は最新にフォールバック", async () => {
    getUserSongRankingsMock.mockResolvedValue([]);
    await handleUserSongRankings(authReq({ version: "9999" }));
    const [, versionArg] = getUserSongRankingsMock.mock.calls[0];
    expect(versionArg).not.toBe("9999");
  });
});

describe("handleGlobalRanking", () => {
  it("公開ユーザーは素の identity、非公開はマスクして rankings を組み立てる", async () => {
    getGlobalRankingMock.mockResolvedValue([
      {
        userId: "me",
        userName: "Me",
        profileImage: null,
        isPublic: 1,
        iidxId: "1234-5678",
        totalBpi: "50",
        arenaClass: "A1",
      },
      {
        userId: "secret",
        userName: "Secret",
        profileImage: "x",
        isPublic: 0,
        iidxId: "9999-9999",
        totalBpi: "40",
        arenaClass: "B2",
      },
    ]);
    getForUserAndVersionMock.mockResolvedValue({ notes: "10" });

    const { result, viewerId } = await handleGlobalRanking(
      authReq({ version: "31", category: "totalBpi" }),
    );

    expect(viewerId).toBe("me");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const body = result.body as {
      rankings: { userId: string; userName: string; isSelf: boolean }[];
      totalCount: number;
      selfRank: number;
    };
    expect(body.totalCount).toBe(2);
    expect(body.rankings[0]).toMatchObject({ userId: "me", isSelf: true });
    expect(body.rankings[1].userName).toBe("非公開ユーザー");
    expect(body.selfRank).toBe(1);
  });

  it("リポジトリが投げたら err(500)", async () => {
    getGlobalRankingMock.mockRejectedValue(new Error("db"));
    getForUserAndVersionMock.mockResolvedValue(null);
    const { result } = await handleGlobalRanking(authReq({}));
    expect(result).toMatchObject({ ok: false, status: 500, message: "db" });
  });
});

describe("handleTowerRanking", () => {
  it("rankings と期間情報を ok で返す", async () => {
    getTowerRankingMock.mockResolvedValue([
      {
        userId: "me",
        userName: "Me",
        profileImage: null,
        isPublic: 1,
        iidxId: "1",
        totalCount: "3",
        keyCount: "2",
        scratchCount: "1",
      },
    ]);
    getLatestScoresWithMusicDataMock.mockResolvedValue([]);

    const { result } = await handleTowerRanking(
      authReq({ version: "31", period: "day", date: "2026-01-01" }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const body = result.body as {
      rankings: unknown[];
      startDate: string;
      endDate: string;
    };
    expect(body.rankings).toHaveLength(1);
    expect(body.startDate).toBe("2026-01-01");
    expect(body.endDate).toBe("2026-01-01");
  });
});
