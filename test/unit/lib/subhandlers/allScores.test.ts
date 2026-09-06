import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextApiRequest } from "next";
import type { AuthenticatedNextApiRequest } from "@/middlewares/api/withAuth";
import {
  handleAllScoresList,
  handleAllScoresHistory,
  handleAllSongRanking,
  handleAllSongRivals,
} from "@/lib/subhandlers/allScores";

const checkProfileAccessMock = vi.fn();
const getAllScoresListMock = vi.fn();
const getRivalScoresForAllSongMock = vi.fn();
const getScoreHistoryMock = vi.fn();
const getAllSongRankingMock = vi.fn();

vi.mock("@/middlewares/api/withApiOnProfile", () => ({
  checkProfileAccess: (...a: unknown[]) => checkProfileAccessMock(...a),
}));

vi.mock("@/lib/db/aggregates/allScores", () => ({
  allScoresAggregateRepo: {
    getAllScoresList: (...a: unknown[]) => getAllScoresListMock(...a),
    getRivalScoresForAllSong: (...a: unknown[]) =>
      getRivalScoresForAllSongMock(...a),
  },
}));

vi.mock("@/lib/db/domains/allScores", () => ({
  allScoresRepo: {
    getScoreHistory: (...a: unknown[]) => getScoreHistoryMock(...a),
    getAllSongRanking: (...a: unknown[]) => getAllSongRankingMock(...a),
  },
}));

const grant = (viewerId: string | undefined = undefined) => ({
  hasAccess: true,
  viewerId,
});
const deny = (status = 403, message = "This profile is set as a private.") => ({
  hasAccess: false,
  error: { status, message },
});

function req(query: Record<string, unknown>): NextApiRequest {
  return { query, headers: {} } as unknown as NextApiRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("handleAllScoresList", () => {
  it("userId が無ければ err(400)", async () => {
    const { result } = await handleAllScoresList(req({}));
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(checkProfileAccessMock).not.toHaveBeenCalled();
  });

  it("アクセス拒否時はその status を返し viewerId を引き継ぐ", async () => {
    checkProfileAccessMock.mockResolvedValue({ ...deny(), viewerId: "viewer" });
    const { result, viewerId } = await handleAllScoresList(
      req({ userId: "target" }),
    );
    expect(result).toMatchObject({ ok: false, status: 403 });
    expect(viewerId).toBe("viewer");
  });

  it("結果ありなら ok(results)", async () => {
    checkProfileAccessMock.mockResolvedValue(grant("target"));
    getAllScoresListMock.mockResolvedValue([{ songId: 1 }]);
    const { result, targetUserId, viewerId } = await handleAllScoresList(
      req({ userId: "target" }),
    );
    expect(result).toEqual({ ok: true, body: [{ songId: 1 }] });
    expect(targetUserId).toBe("target");
    expect(viewerId).toBe("target");
  });

  it("結果が空なら err(404)", async () => {
    checkProfileAccessMock.mockResolvedValue(grant("target"));
    getAllScoresListMock.mockResolvedValue([]);
    const { result } = await handleAllScoresList(req({ userId: "target" }));
    expect(result).toMatchObject({ ok: false, status: 404 });
  });

  it("リポジトリが投げたら err(500)", async () => {
    checkProfileAccessMock.mockResolvedValue(grant("target"));
    getAllScoresListMock.mockRejectedValue(new Error("db down"));
    const { result } = await handleAllScoresList(req({ userId: "target" }));
    expect(result).toEqual({ ok: false, status: 500, message: "db down" });
  });
});

describe("handleAllScoresHistory", () => {
  it("songId が無ければ err(400)", async () => {
    const { result } = await handleAllScoresHistory(req({ userId: "target" }));
    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it("正常時は履歴を ok で返す", async () => {
    checkProfileAccessMock.mockResolvedValue(grant("v"));
    getScoreHistoryMock.mockResolvedValue({ "31": [] });
    const { result } = await handleAllScoresHistory(
      req({ userId: "target", songId: "42" }),
    );
    expect(result).toEqual({ ok: true, body: { "31": [] } });
    expect(getScoreHistoryMock).toHaveBeenCalledWith("target", "42");
  });
});

describe("handleAllSongRanking", () => {
  const authReq = (query: Record<string, unknown>) =>
    ({ query, authUid: "me" }) as unknown as AuthenticatedNextApiRequest;

  it("songId が数値でなければ err(400)", async () => {
    const { result } = await handleAllSongRanking(authReq({ songId: "x" }));
    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it("正常時は viewerId=authUid で取得し ok", async () => {
    getAllSongRankingMock.mockResolvedValue({ rows: [] });
    const { result, viewerId, targetUserId } = await handleAllSongRanking(
      authReq({ songId: "10", userId: "me", version: "31" }),
    );
    expect(result).toEqual({ ok: true, body: { rows: [] } });
    expect(viewerId).toBe("me");
    expect(targetUserId).toBe("me");
    expect(getAllSongRankingMock).toHaveBeenCalledWith(10, "31", "me");
  });

  it("不正な version は最新にフォールバックする", async () => {
    getAllSongRankingMock.mockResolvedValue({});
    await handleAllSongRanking(authReq({ songId: "10", version: "9999" }));
    const [, versionArg] = getAllSongRankingMock.mock.calls[0];
    expect(versionArg).not.toBe("9999");
  });
});

describe("handleAllSongRivals", () => {
  it("songId が無ければ err(400)", async () => {
    const { result } = await handleAllSongRivals(req({ userId: "target" }), {
      hasAccess: true,
    });
    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it("正常時は rivals を整形して ok、viewerId は access 由来", async () => {
    getRivalScoresForAllSongMock.mockResolvedValue([
      {
        userId: "r1",
        userName: "Rival",
        profileImage: null,
        exScore: 1000,
        bpi: "12.34",
        clearState: "CLEAR",
        lastPlayed: null,
      },
    ]);
    const { result, viewerId } = await handleAllSongRivals(
      req({ userId: "target", songId: "7", version: "31" }),
      { hasAccess: true, viewerId: "viewer" },
    );
    expect(viewerId).toBe("viewer");
    expect(result).toEqual({
      ok: true,
      body: {
        songId: 7,
        version: "31",
        rivals: [
          {
            userId: "r1",
            userName: "Rival",
            profileImage: null,
            exScore: 1000,
            bpi: 12.34,
            clearState: "CLEAR",
            lastPlayed: null,
          },
        ],
      },
    });
  });
});
