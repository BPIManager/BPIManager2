import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextApiRequest } from "next";
import type { AuthenticatedNextApiRequest } from "@/middlewares/api/withAuth";
import {
  handleScoresList,
  handleScoreHistory,
  handleBestEver,
  handleSelfVersion,
  handleUnplayed,
  handleScoresBulk,
  handleScoresTransfer,
} from "@/lib/subhandlers/scores";

const getScoresWithDetailsMock = vi.fn();
const getHistoryForSongMock = vi.fn();
const getBestEverScoresMock = vi.fn();
const getSelfVersionScoresMock = vi.fn();
const getUnplayedSongsMock = vi.fn();
const collectionMock = vi.fn();

vi.mock("@/lib/db/domains/scores/detail", () => ({
  scoreDetailRepo: {
    getScoresWithDetails: (...a: unknown[]) => getScoresWithDetailsMock(...a),
  },
}));
vi.mock("@/lib/db/domains/scores", () => ({
  scoresRepo: {
    getHistoryForSong: (...a: unknown[]) => getHistoryForSongMock(...a),
    getLatestScores: vi.fn().mockResolvedValue([]),
  },
}));
vi.mock("@/lib/db/domains/scores/timeline", () => ({
  timelineRepo: {
    getBestEverScores: (...a: unknown[]) => getBestEverScoresMock(...a),
    getSelfVersionScores: (...a: unknown[]) => getSelfVersionScoresMock(...a),
  },
}));
vi.mock("@/lib/db/aggregates/unplayedSongs", () => ({
  unplayedSongsAggregateRepo: {
    getUnplayedSongs: (...a: unknown[]) => getUnplayedSongsMock(...a),
  },
}));
vi.mock("@/lib/db/domains/allScores", () => ({
  allScoresRepo: { getLatestAllScores: vi.fn().mockResolvedValue([]) },
}));
vi.mock("@/lib/db/domains/logs/navigation", () => ({
  navigationRepo: { getLatestTotalBpi: vi.fn().mockResolvedValue(null) },
}));
vi.mock("@/lib/db/domains/songs", () => ({
  songsRepo: { getSongMasterWithDef: vi.fn().mockResolvedValue([]) },
}));
vi.mock("@/lib/db/domains/allSongs", () => ({
  allSongsRepo: { getAllLevelMaster: vi.fn().mockResolvedValue([]) },
}));
vi.mock("@/lib/db/orchestrators/bpiImport", () => ({
  saveImportResults: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/bpi", () => ({
  BpiCalculator: { calc: () => 0, calculateTotalBPI: () => 0 },
}));
vi.mock("@/lib/transfer/importer", () => ({
  BpiImportService: class {
    saveMultipleFirestoreData = vi.fn().mockResolvedValue({ totalProcessed: 0 });
  },
}));
vi.mock("@/lib/firebase/admin", () => ({
  adminDb: { collection: (...a: unknown[]) => collectionMock(...a) },
}));
vi.mock("@/utils/logs/getMapFlatten", () => ({
  mapToFlatSong: (r: unknown) => r,
}));
vi.mock("@/utils/songs/filter", () => ({
  filterSongsServerSide: (s: unknown) => s,
}));
vi.mock("@/utils/songs/sort", () => ({ sortSongs: (s: unknown) => s }));

const req = (query: Record<string, unknown>) =>
  ({ query }) as unknown as NextApiRequest;
const access = {
  hasAccess: true,
  viewerId: "target",
  user: { userId: "target", isPublic: 1 },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("handleScoresList", () => {
  it("数値パラメータが不正なら err(400)", async () => {
    const { result } = await handleScoresList(
      req({ userId: "target", bpiMin: "abc" }),
      access,
    );
    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it("version 未指定でも最新へフォールバックして ok", async () => {
    getScoresWithDetailsMock.mockResolvedValue([{ songId: 1 }]);
    const { result } = await handleScoresList(req({ userId: "target" }), access);
    expect(result).toEqual({ ok: true, body: [{ songId: 1 }] });
    expect(getScoresWithDetailsMock).toHaveBeenCalled();
  });

  it("正常時は加工済み配列を ok、meta は access 由来", async () => {
    getScoresWithDetailsMock.mockResolvedValue([{ songId: 1 }]);
    const { result, targetUserId, viewerId } = await handleScoresList(
      req({ userId: "target", version: "31" }),
      access,
    );
    expect(result).toEqual({ ok: true, body: [{ songId: 1 }] });
    expect(targetUserId).toBe("target");
    expect(viewerId).toBe("target");
  });
});

describe("handleScoreHistory", () => {
  it("songId が不正なら err(400)", async () => {
    const { result } = await handleScoreHistory(
      req({ userId: "target", songId: "abc" }),
      access,
    );
    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it("version でグルーピングして ok", async () => {
    getHistoryForSongMock.mockResolvedValue([
      { version: "31", exScore: 1 },
      { version: "31", exScore: 2 },
      { version: "30", exScore: 3 },
    ]);
    const { result } = await handleScoreHistory(
      req({ userId: "target", songId: "1000" }),
      access,
    );
    expect(result).toMatchObject({
      ok: true,
      body: { "31": [{ exScore: 1 }, { exScore: 2 }], "30": [{ exScore: 3 }] },
    });
    expect(getHistoryForSongMock).toHaveBeenCalledWith("target", 1000);
  });
});

describe("handleBestEver", () => {
  it("currentVersion 未指定は err(400)", async () => {
    const { result } = await handleBestEver(req({ userId: "target" }), access);
    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it("正常時は数値変換済みの配列を ok", async () => {
    getBestEverScoresMock.mockResolvedValue([
      {
        songId: "1",
        title: "t",
        notes: "500",
        bpm: "150",
        difficulty: "ANOTHER",
        difficultyLevel: "12",
        releasedVersion: "20",
        bestExScore: "900",
        bestBpi: "50",
        bestVersion: "31",
        wrScore: "1000",
        kaidenAvg: "950",
        coef: "1.2",
      },
    ]);
    const { result } = await handleBestEver(
      req({ userId: "target", currentVersion: "31" }),
      access,
    );
    expect(result).toMatchObject({
      ok: true,
      body: [{ songId: 1, notes: 500, bestExScore: 900 }],
    });
  });
});

describe("handleSelfVersion", () => {
  it("同一バージョン指定は refine で err(400)", async () => {
    const { result } = await handleSelfVersion(
      req({ userId: "target", currentVersion: "31", targetVersion: "31" }),
      access,
    );
    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it("正常時は差分計算付きの配列を ok", async () => {
    getSelfVersionScoresMock.mockResolvedValue([
      {
        songId: 1,
        title: "t",
        notes: 500,
        bpm: "150",
        difficulty: "ANOTHER",
        difficultyLevel: 12,
        myExScore: 900,
        prevExScore: 800,
        myBpi: 50,
        prevBpi: 40,
      },
    ]);
    const { result } = await handleSelfVersion(
      req({ userId: "target", currentVersion: "31", targetVersion: "30" }),
      access,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      const row = (result.body as Array<Record<string, unknown>>)[0];
      expect(row.exDiff).toBe(100);
      expect(row.bpiDiff).toBe(10);
    }
  });
});

describe("handleUnplayed", () => {
  it("version 未指定は err(400)", async () => {
    const { result } = await handleUnplayed(req({ userId: "target" }), access);
    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it("正常時は未プレイ曲配列を ok", async () => {
    getUnplayedSongsMock.mockResolvedValue([
      {
        songId: "1",
        title: "t",
        notes: "500",
        bpm: "150",
        difficulty: "ANOTHER",
        difficultyLevel: "12",
        releasedVersion: "20",
        wrScore: null,
        kaidenAvg: null,
        coef: null,
      },
    ]);
    const { result } = await handleUnplayed(
      req({ userId: "target", version: "31" }),
      access,
    );
    expect(result).toMatchObject({
      ok: true,
      body: [{ songId: 1, exScore: null, bpi: null }],
    });
  });
});

describe("handleScoresBulk", () => {
  const authReq = (body: unknown) =>
    ({ authUid: "me", body }) as unknown as AuthenticatedNextApiRequest;

  it("不正なリクエストボディは err(400)、targetUserId/viewerId は authUid", async () => {
    const { result, targetUserId, viewerId } = await handleScoresBulk(
      authReq({ version: "not-a-version" }),
    );
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(targetUserId).toBe("me");
    expect(viewerId).toBe("me");
  });

  it("正常時は集計結果を ok", async () => {
    const { result } = await handleScoresBulk(
      authReq({ version: "31", csvRows: [] }),
    );
    expect(result).toMatchObject({ ok: true, body: { success: true } });
  });
});

describe("handleScoresTransfer", () => {
  const authReq = () =>
    ({ authUid: "me" }) as unknown as AuthenticatedNextApiRequest;

  it("Firestore にデータが無ければ err(404)", async () => {
    collectionMock.mockReturnValue({
      doc: () => ({ get: async () => ({ exists: false }) }),
    });
    const { result } = await handleScoresTransfer(authReq());
    expect(result).toMatchObject({ ok: false, status: 404 });
  });
});
