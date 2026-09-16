import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AuthenticatedNextApiRequest } from "@/middlewares/api/withAuth";

const getSongMasterWithDefMock = vi.fn();
const getAllLevelMasterMock = vi.fn();
const getLatestScoresMock = vi.fn();
const getLatestAllScoresMock = vi.fn();
const saveManualScoreUpdateMock = vi.fn();

vi.mock("@/lib/db/domains/songs", () => ({
  songsRepo: { getSongMasterWithDef: (...a: unknown[]) => getSongMasterWithDefMock(...a) },
}));
vi.mock("@/lib/db/domains/allSongs", () => ({
  allSongsRepo: { getAllLevelMaster: (...a: unknown[]) => getAllLevelMasterMock(...a) },
}));
vi.mock("@/lib/db/domains/scores", () => ({
  scoresRepo: { getLatestScores: (...a: unknown[]) => getLatestScoresMock(...a) },
}));
vi.mock("@/lib/db/domains/allScores", () => ({
  allScoresRepo: { getLatestAllScores: (...a: unknown[]) => getLatestAllScoresMock(...a) },
}));
vi.mock("@/lib/db/orchestrators/manualScoreUpdate", () => ({
  saveManualScoreUpdate: (...a: unknown[]) => saveManualScoreUpdateMock(...a),
}));

const { handleScoreManualUpdate } = await import("@/lib/subhandlers/scores/manual");

const song = {
  songId: 1,
  defId: 10,
  title: "Test Song",
  difficulty: "ANOTHER",
  difficultyLevel: 12,
  notes: 1000,
  kaidenAvg: null,
  wrScore: null,
  coef: null,
  mu: null,
  sigma: null,
  residualVar: null,
};

function req(body: Record<string, unknown>): AuthenticatedNextApiRequest {
  return { body, authUid: "user-1", headers: {} } as unknown as AuthenticatedNextApiRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  getAllLevelMasterMock.mockResolvedValue([]);
  getLatestAllScoresMock.mockResolvedValue([]);
});

describe("handleScoreManualUpdate", () => {
  it("バリデーション失敗はerr(400)", async () => {
    const { result } = await handleScoreManualUpdate(
      req({ songId: -1, version: "34", exScore: 900 }),
    );
    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it("BPI定義の無い曲はerr(404)", async () => {
    getSongMasterWithDefMock.mockResolvedValue([]);
    getLatestScoresMock.mockResolvedValue([]);
    const { result } = await handleScoreManualUpdate(
      req({ songId: 1, version: "34", exScore: 900 }),
    );
    expect(result).toMatchObject({ ok: false, status: 404 });
  });

  it("既存の自己ベストを上回らない場合はerr(400)、保存しない", async () => {
    getSongMasterWithDefMock.mockResolvedValue([song]);
    getLatestScoresMock.mockResolvedValue([
      { songId: 1, exScore: 950, clearState: "HARD", missCount: 0 },
    ]);
    const { result } = await handleScoreManualUpdate(
      req({ songId: 1, version: "34", exScore: 900 }),
    );
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(saveManualScoreUpdateMock).not.toHaveBeenCalled();
  });

  it("自己ベスト更新時は保存してok", async () => {
    getSongMasterWithDefMock.mockResolvedValue([song]);
    getLatestScoresMock.mockResolvedValue([
      { songId: 1, exScore: 800, clearState: "HARD", missCount: 3 },
    ]);
    saveManualScoreUpdateMock.mockResolvedValue({
      totalBpi: 55.5,
      batchId: "manual-user-1-34-2026-09-17",
    });

    const { result } = await handleScoreManualUpdate(
      req({ songId: 1, version: "34", exScore: 900 }),
    );

    expect(result.ok).toBe(true);
    expect(saveManualScoreUpdateMock).toHaveBeenCalledTimes(1);
    const call = saveManualScoreUpdateMock.mock.calls[0][0];
    expect(call.userId).toBe("user-1");
    expect(call.version).toBe("34");
    expect(call.score.exScore).toBe(900);
    if (result.ok) {
      expect(result.body).toMatchObject({ totalBpi: 55.5, songId: 1, exScore: 900 });
    }
  });

  it("未プレイ曲を新規保存する場合もok", async () => {
    getSongMasterWithDefMock.mockResolvedValue([song]);
    getLatestScoresMock.mockResolvedValue([]);
    saveManualScoreUpdateMock.mockResolvedValue({
      totalBpi: 10,
      batchId: "manual-user-1-34-2026-09-17",
    });

    const { result } = await handleScoreManualUpdate(
      req({ songId: 1, version: "34", exScore: 500 }),
    );

    expect(result.ok).toBe(true);
    expect(saveManualScoreUpdateMock).toHaveBeenCalledTimes(1);
  });
});
