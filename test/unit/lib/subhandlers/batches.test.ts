import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextApiRequest } from "next";
import {
  handleBatchesList,
  handleBatchDetail,
  handleBatchDelete,
  handleBatchScores,
  handleVersionSummary,
} from "@/lib/subhandlers/batches";

const checkProfileAccessMock = vi.fn();
const authenticateViewerMock = vi.fn();
const getTimelineByBatchesMock = vi.fn();
const getScoreHistoryMock = vi.fn();
const getTotalSongCountMock = vi.fn();
const calculateTotalBpiMock = vi.fn();
const findBatchByIdMock = vi.fn();
const findBatchByIdAndUserMock = vi.fn();
const findBatchesInRangeMock = vi.fn();
const getBatchNavigationMock = vi.fn();
const getRangeNavigationMock = vi.fn();
const getJstRangeMock = vi.fn();
const getScoresWithDetailsMock = vi.fn();
const getOvertakenRivalsMock = vi.fn();
const deleteBatchMock = vi.fn();
const getPreviousVersionWithScoresMock = vi.fn();
const getSelfVersionScoresMock = vi.fn();

vi.mock("@/middlewares/api/withApiOnProfile", () => ({
  checkProfileAccess: (...a: unknown[]) => checkProfileAccessMock(...a),
}));
vi.mock("@/middlewares/api/withApi", () => ({
  authenticateViewer: (...a: unknown[]) => authenticateViewerMock(...a),
}));
vi.mock("@/lib/db/aggregates/scoreTimeline", () => ({
  scoreTimelineRepo: {
    getTimelineByBatches: (...a: unknown[]) => getTimelineByBatchesMock(...a),
  },
}));
vi.mock("@/lib/db/aggregates/stats/tables", () => ({
  statsTablesRepo: {
    getScoreHistory: (...a: unknown[]) => getScoreHistoryMock(...a),
    getTotalSongCount: (...a: unknown[]) => getTotalSongCountMock(...a),
  },
}));
vi.mock("@/lib/db/aggregates/rivalScores/rival", () => ({
  rivalRepo: {
    getOvertakenRivals: (...a: unknown[]) => getOvertakenRivalsMock(...a),
    getRivalLatestScoresBySong: vi.fn().mockResolvedValue([]),
  },
}));
vi.mock("@/lib/db/domains/logs/navigation", () => ({
  navigationRepo: {
    findBatchById: (...a: unknown[]) => findBatchByIdMock(...a),
    findBatchByIdAndUser: (...a: unknown[]) => findBatchByIdAndUserMock(...a),
    findBatchesInRange: (...a: unknown[]) => findBatchesInRangeMock(...a),
    getBatchNavigation: (...a: unknown[]) => getBatchNavigationMock(...a),
    getRangeNavigation: (...a: unknown[]) => getRangeNavigationMock(...a),
    getJstRange: (...a: unknown[]) => getJstRangeMock(...a),
  },
}));
vi.mock("@/lib/db/domains/scores/detail", () => ({
  scoreDetailRepo: {
    getScoresWithDetails: (...a: unknown[]) => getScoresWithDetailsMock(...a),
    getScoresByLastPlayedRange: vi.fn().mockResolvedValue([]),
  },
}));
vi.mock("@/lib/db/domains/scores", () => ({
  scoresRepo: {
    getPreviousVersionWithScores: (...a: unknown[]) =>
      getPreviousVersionWithScoresMock(...a),
  },
}));
vi.mock("@/lib/db/domains/scores/timeline", () => ({
  timelineRepo: {
    getSelfVersionScores: (...a: unknown[]) => getSelfVersionScoresMock(...a),
  },
}));
vi.mock("@/lib/db/orchestrators/batchDeletion", () => ({
  deleteBatch: (...a: unknown[]) => deleteBatchMock(...a),
}));
vi.mock("@/services/logs/calculateTotalBpi", () => ({
  calculateTotalBpi: (...a: unknown[]) => calculateTotalBpiMock(...a),
}));
vi.mock("@/utils/logs/getMapNested", () => ({
  mapToLogNested: (s: unknown) => s,
}));

function req(query: Record<string, unknown>): NextApiRequest {
  return { query, headers: {} } as unknown as NextApiRequest;
}
const access = { hasAccess: true, viewerId: "u1" };

beforeEach(() => {
  vi.clearAllMocks();
  getJstRangeMock.mockReturnValue({
    start: new Date("2024-01-01"),
    end: new Date("2024-01-02"),
    label: "2024-01-01",
  });
  getRangeNavigationMock.mockResolvedValue({ prevDate: null, nextDate: null });
});

describe("handleBatchesList", () => {
  it("topN が数値でなければ err(400)", async () => {
    const { result } = await handleBatchesList(
      req({ userId: "u1", topN: "abc" }),
      access,
    );
    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it("groupedBy=batch は getTimelineByBatches の結果を ok", async () => {
    getTimelineByBatchesMock.mockResolvedValue([{ id: 1 }]);
    const { result, targetUserId, viewerId } = await handleBatchesList(
      req({ userId: "u1", version: "31", groupedBy: "batch" }),
      access,
    );
    expect(result).toEqual({ ok: true, body: [{ id: 1 }] });
    expect(targetUserId).toBe("u1");
    expect(viewerId).toBe("u1");
  });

  it("groupedBy=lastPlayed は calculateTotalBpi を通す", async () => {
    getScoreHistoryMock.mockResolvedValue([]);
    getTotalSongCountMock.mockResolvedValue(100);
    calculateTotalBpiMock.mockReturnValue([{ id: "d" }]);
    const { result } = await handleBatchesList(
      req({ userId: "u1", version: "31", groupedBy: "lastPlayed" }),
      access,
    );
    expect(result).toEqual({ ok: true, body: [{ id: "d" }] });
  });
});

describe("handleBatchDetail", () => {
  it("version が無ければ err(400)", async () => {
    const { result } = await handleBatchDetail(
      req({ userId: "u1", batchId: "b1" }),
    );
    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it("アクセス拒否はその status を返す", async () => {
    checkProfileAccessMock.mockResolvedValue({
      hasAccess: false,
      error: { status: 403, message: "private" },
    });
    const { result } = await handleBatchDetail(
      req({ userId: "u1", batchId: "b1", version: "31" }),
    );
    expect(result).toMatchObject({ ok: false, status: 403 });
  });

  it("バッチが見つからなければ err(404)", async () => {
    checkProfileAccessMock.mockResolvedValue({ hasAccess: true, viewerId: "u1" });
    findBatchByIdMock.mockResolvedValue(null);
    const { result } = await handleBatchDetail(
      req({ userId: "u1", batchId: "b1", version: "31" }),
    );
    expect(result).toMatchObject({ ok: false, status: 404 });
  });

  it("正常時は songs / pagination を ok", async () => {
    checkProfileAccessMock.mockResolvedValue({ hasAccess: true, viewerId: "u1" });
    findBatchByIdMock.mockResolvedValue({
      batchId: "b1",
      createdAt: new Date("2024-01-01T12:00:00Z"),
    });
    getBatchNavigationMock.mockResolvedValue({ prev: null, next: null });
    findBatchesInRangeMock.mockResolvedValue([{ batchId: "b1" }]);
    getScoresWithDetailsMock.mockResolvedValue([]);
    getOvertakenRivalsMock.mockResolvedValue([]);
    const { result } = await handleBatchDetail(
      req({ userId: "u1", batchId: "b1", version: "31" }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.body).toHaveProperty("songs");
      expect(result.body).toHaveProperty("pagination");
    }
  });
});

describe("handleBatchDelete", () => {
  it("閲覧者が本人でなければ err(403)", async () => {
    authenticateViewerMock.mockResolvedValue("other");
    const { result } = await handleBatchDelete(
      req({ userId: "u1", batchId: "b1" }),
    );
    expect(result).toMatchObject({ ok: false, status: 403 });
    expect(deleteBatchMock).not.toHaveBeenCalled();
  });

  it("バッチが見つからなければ err(404)", async () => {
    authenticateViewerMock.mockResolvedValue("u1");
    findBatchByIdAndUserMock.mockResolvedValue(null);
    const { result } = await handleBatchDelete(
      req({ userId: "u1", batchId: "b1" }),
    );
    expect(result).toMatchObject({ ok: false, status: 404 });
  });

  it("正常時は削除して ok", async () => {
    authenticateViewerMock.mockResolvedValue("u1");
    findBatchByIdAndUserMock.mockResolvedValue({ batchId: "b1" });
    deleteBatchMock.mockResolvedValue(undefined);
    const { result } = await handleBatchDelete(
      req({ userId: "u1", batchId: "b1" }),
    );
    expect(result).toEqual({
      ok: true,
      body: { message: "Batch deleted successfully." },
    });
    expect(deleteBatchMock).toHaveBeenCalledWith("u1", "b1");
  });
});

describe("handleBatchScores", () => {
  it("version が無ければ err(400)", async () => {
    const { result } = await handleBatchScores(
      req({ userId: "u1", batchId: "2024-01-01" }),
    );
    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it("アクセス拒否はその status を返す", async () => {
    checkProfileAccessMock.mockResolvedValue({
      hasAccess: false,
      error: { status: 404, message: "User not found." },
    });
    const { result } = await handleBatchScores(
      req({ userId: "u1", batchId: "2024-01-01", version: "31" }),
    );
    expect(result).toMatchObject({ ok: false, status: 404 });
  });

  it("正常時(createdAt)は songs / pagination / range を ok", async () => {
    checkProfileAccessMock.mockResolvedValue({ hasAccess: true, viewerId: "u1" });
    findBatchesInRangeMock.mockResolvedValue([
      { batchId: "b1", createdAt: new Date("2024-01-01") },
    ]);
    getScoresWithDetailsMock.mockResolvedValue([]);
    getOvertakenRivalsMock.mockResolvedValue([]);
    const { result } = await handleBatchScores(
      req({ userId: "u1", batchId: "2024-01-01", version: "31" }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.body).toHaveProperty("songs");
      expect(result.body).toHaveProperty("range");
    }
  });
});

describe("handleVersionSummary", () => {
  it("version が enum 外なら err(400)", async () => {
    const { result } = await handleVersionSummary(
      req({ userId: "u1", version: "zzz" }),
    );
    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it("比較バージョンが無ければ空 songs を ok", async () => {
    checkProfileAccessMock.mockResolvedValue({ hasAccess: true, viewerId: "u1" });
    getPreviousVersionWithScoresMock.mockResolvedValue(null);
    const { result } = await handleVersionSummary(
      req({ userId: "u1", version: "31" }),
    );
    expect(result).toMatchObject({
      ok: true,
      body: { songs: [], compareVersion: null },
    });
  });

  it("正常時は差分計算済みの songs を ok", async () => {
    checkProfileAccessMock.mockResolvedValue({ hasAccess: true, viewerId: "u1" });
    getPreviousVersionWithScoresMock.mockResolvedValue("30");
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
    const { result } = await handleVersionSummary(
      req({ userId: "u1", version: "31" }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      const body = result.body as {
        songs: Array<{ diff: { exScore: number; bpi: number } }>;
        compareVersion: string;
      };
      expect(body.compareVersion).toBe("30");
      expect(body.songs[0].diff.exScore).toBe(100);
      expect(body.songs[0].diff.bpi).toBe(10);
    }
  });
});
