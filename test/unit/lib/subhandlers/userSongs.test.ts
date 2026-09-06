import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextApiRequest } from "next";
import {
  handleSongList,
  handleUserSongRanking,
  handleUserSongSimilar,
} from "@/lib/subhandlers/userSongs";

const getSongListMock = vi.fn();
const getSimilarSongsMock = vi.fn();
const getSongRankingMock = vi.fn();

vi.mock("@/lib/db/domains/songs", () => ({
  songsRepo: {
    getSongList: (...a: unknown[]) => getSongListMock(...a),
    getSimilarSongs: (...a: unknown[]) => getSimilarSongsMock(...a),
  },
}));
vi.mock("@/lib/db/aggregates/stats/tables", () => ({
  statsTablesRepo: {
    getSongRanking: (...a: unknown[]) => getSongRankingMock(...a),
  },
}));

const req = (query: Record<string, unknown>) =>
  ({ query }) as unknown as NextApiRequest;
const access = { hasAccess: true, viewerId: "v", user: { userId: "target" } };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("handleSongList", () => {
  it("曲リストをそのまま ok、viewerId は access 由来", async () => {
    getSongListMock.mockResolvedValue([{ songId: 1 }]);
    const { result, viewerId, targetUserId } = await handleSongList(
      req({ userId: "target", version: "31" }),
      access,
    );
    expect(result).toEqual({ ok: true, body: [{ songId: 1 }] });
    expect(viewerId).toBe("v");
    expect(targetUserId).toBe("target");
    expect(getSongListMock).toHaveBeenCalledWith("31");
  });

  it("不正な version は最新へフォールバック", async () => {
    getSongListMock.mockResolvedValue([]);
    await handleSongList(req({ userId: "target", version: "zzz" }), access);
    expect(getSongListMock.mock.calls[0][0]).not.toBe("zzz");
  });
});

describe("handleUserSongRanking", () => {
  it("songId が数値でなければ err(400)", async () => {
    const { result } = await handleUserSongRanking(
      req({ userId: "target", songId: "x" }),
      access,
    );
    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it("正常時は access.user.userId を viewer として取得し ok", async () => {
    getSongRankingMock.mockResolvedValue({ rows: [] });
    const { result } = await handleUserSongRanking(
      req({ userId: "target", songId: "9", version: "31" }),
      access,
    );
    expect(result).toEqual({ ok: true, body: { rows: [] } });
    expect(getSongRankingMock).toHaveBeenCalledWith(9, "31", "target");
  });
});

describe("handleUserSongSimilar", () => {
  it("songId が数値でなければ err(400)", async () => {
    const { result } = await handleUserSongSimilar(
      req({ userId: "target", songId: "x" }),
      access,
    );
    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it("limit は 1..50 にクランプ、mode は global/profile のみ", async () => {
    getSimilarSongsMock.mockResolvedValue([]);
    await handleUserSongSimilar(
      req({ userId: "t", songId: "9", limit: "999", mode: "weird" }),
      access,
    );
    const [, , limitArg, modeArg] = getSimilarSongsMock.mock.calls[0];
    expect(limitArg).toBe(50);
    expect(modeArg).toBe("profile");
  });

  it("mode=global はそのまま渡る", async () => {
    getSimilarSongsMock.mockResolvedValue([]);
    await handleUserSongSimilar(
      req({ userId: "t", songId: "9", mode: "global" }),
      access,
    );
    expect(getSimilarSongsMock.mock.calls[0][3]).toBe("global");
  });
});
