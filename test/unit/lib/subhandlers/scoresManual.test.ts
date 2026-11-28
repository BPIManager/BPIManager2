import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AuthenticatedNextApiRequest } from "@/middlewares/api/withAuth";

const getSongMasterWithDefMock = vi.fn();
const getAllLevelMasterMock = vi.fn();
const getLatestScoresMock = vi.fn();
const getLatestAllScoresMock = vi.fn();
const saveManualScoreUpdateMock = vi.fn();
const findMaxTotalBpiMock = vi.fn();

vi.mock("@/lib/db/domains/songs/master", () => ({
  songMasterRepo: { getSongMasterWithDef: (...a: unknown[]) => getSongMasterWithDefMock(...a) },
}));
vi.mock("@/lib/db/domains/allSongs", () => ({
  allSongsRepo: { getAllLevelMaster: (...a: unknown[]) => getAllLevelMasterMock(...a) },
}));
vi.mock("@/lib/db/domains/scores/latest", () => ({
  latestScoresRepo: { getLatestScores: (...a: unknown[]) => getLatestScoresMock(...a) },
}));
vi.mock("@/lib/db/domains/allScores", () => ({
  allScoresRepo: { getLatestAllScores: (...a: unknown[]) => getLatestAllScoresMock(...a) },
}));
vi.mock("@/lib/db/domains/userStatusLogs/read", () => ({
  userStatusLogsReadRepo: { findMaxTotalBpi: (...a: unknown[]) => findMaxTotalBpiMock(...a) },
}));
vi.mock("@/lib/db/orchestrators/manualScoreUpdate", () => ({
  saveManualScoreUpdate: (...a: unknown[]) => saveManualScoreUpdateMock(...a),
}));

const { handleScoreManualUpdate } = await import("@/lib/subhandlers/scores/manual");
const { BpiCalculator } = await import("@/lib/bpi");

const bpiSong = {
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

// 同じ楽曲・難易度のallSongsドメイン側（songIdの値は別物）
const allSongForBpiSong = {
  songId: 501,
  title: "Test Song",
  difficulty: "ANOTHER",
  difficultyLevel: 12,
  notes: 1000,
  bpm: "150",
  textage: "",
};

// ☆10以下の楽曲（BPIドメインには存在しない）
const nonBpiAllSong = {
  songId: 900,
  title: "Easy Song",
  difficulty: "NORMAL",
  difficultyLevel: 5,
  notes: 300,
  bpm: "120",
  textage: "",
};

function req(body: Record<string, unknown>): AuthenticatedNextApiRequest {
  return { body, authUid: "user-1", headers: {} } as unknown as AuthenticatedNextApiRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("handleScoreManualUpdate", () => {
  it("バリデーション失敗はerr(400)", async () => {
    const { result } = await handleScoreManualUpdate(
      req({ songId: -1, songDomain: "bpi", version: "34", exScore: 900 }),
    );
    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it("songDomain=bpiで楽曲が見つからなければerr(404)", async () => {
    getSongMasterWithDefMock.mockResolvedValue([]);
    getAllLevelMasterMock.mockResolvedValue([]);
    getLatestScoresMock.mockResolvedValue([]);
    getLatestAllScoresMock.mockResolvedValue([]);
    const { result } = await handleScoreManualUpdate(
      req({ songId: 1, songDomain: "bpi", version: "34", exScore: 900 }),
    );
    expect(result).toMatchObject({ ok: false, status: 404 });
  });

  it("notes*2(理論値)を超えるexScoreはerr(400)、保存しない(#437)", async () => {
    getSongMasterWithDefMock.mockResolvedValue([bpiSong]);
    getAllLevelMasterMock.mockResolvedValue([allSongForBpiSong]);
    getLatestScoresMock.mockResolvedValue([
      { songId: 1, exScore: 950, clearState: "HARD", missCount: 0 },
    ]);
    getLatestAllScoresMock.mockResolvedValue([
      { songId: 501, exScore: 950, clearState: "HARD", missCount: 0 },
    ]);
    // bpiSong.notes=1000のため理論上の最大値は2000
    const { result } = await handleScoreManualUpdate(
      req({ songId: 1, songDomain: "bpi", version: "34", exScore: 2001 }),
    );
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(saveManualScoreUpdateMock).not.toHaveBeenCalled();
  });

  it("songDomain=bpiで改善が無ければerr(400)、保存しない", async () => {
    getSongMasterWithDefMock.mockResolvedValue([bpiSong]);
    getAllLevelMasterMock.mockResolvedValue([allSongForBpiSong]);
    getLatestScoresMock.mockResolvedValue([
      { songId: 1, exScore: 950, clearState: "HARD", missCount: 0 },
    ]);
    getLatestAllScoresMock.mockResolvedValue([
      { songId: 501, exScore: 950, clearState: "HARD", missCount: 0 },
    ]);
    const { result } = await handleScoreManualUpdate(
      req({ songId: 1, songDomain: "bpi", version: "34", exScore: 900 }),
    );
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(saveManualScoreUpdateMock).not.toHaveBeenCalled();
  });

  it("☆11/12をsongDomain=bpiで編集した場合、scores/allScores両方の改善を試みて両方保存する", async () => {
    getSongMasterWithDefMock.mockResolvedValue([bpiSong]);
    getAllLevelMasterMock.mockResolvedValue([allSongForBpiSong]);
    getLatestScoresMock.mockResolvedValue([
      { songId: 1, exScore: 800, clearState: "HARD", missCount: 3 },
    ]);
    getLatestAllScoresMock.mockResolvedValue([
      { songId: 501, exScore: 700, clearState: "HARD", missCount: 3 },
    ]);
    saveManualScoreUpdateMock.mockResolvedValue({
      totalBpi: 55.5,
      batchId: "manual-user-1-34-2026-09-17",
    });

    const { result } = await handleScoreManualUpdate(
      req({ songId: 1, songDomain: "bpi", version: "34", exScore: 900 }),
    );

    expect(result.ok).toBe(true);
    expect(saveManualScoreUpdateMock).toHaveBeenCalledTimes(1);
    const call = saveManualScoreUpdateMock.mock.calls[0][0];
    expect(call.score).toMatchObject({ songId: 1, exScore: 900 });
    expect(call.allScore).toMatchObject({ songId: 501, exScore: 900 });
    expect(call.computeTotalBpi).toBeTypeOf("function");
    if (result.ok) {
      expect(result.body).toMatchObject({
        totalBpi: 55.5,
        scoresSaved: true,
        allScoresSaved: true,
      });
    }
  });

  it("☆11/12をsongDomain=allSongsで編集した場合も、scores/allScores両方を試みる", async () => {
    getSongMasterWithDefMock.mockResolvedValue([bpiSong]);
    getAllLevelMasterMock.mockResolvedValue([allSongForBpiSong]);
    getLatestScoresMock.mockResolvedValue([]);
    getLatestAllScoresMock.mockResolvedValue([]);
    saveManualScoreUpdateMock.mockResolvedValue({
      totalBpi: 10,
      batchId: "manual-user-1-34-2026-09-17",
    });

    const { result } = await handleScoreManualUpdate(
      req({ songId: 501, songDomain: "allSongs", version: "34", exScore: 500 }),
    );

    expect(result.ok).toBe(true);
    const call = saveManualScoreUpdateMock.mock.calls[0][0];
    expect(call.score).toMatchObject({ songId: 1 });
    expect(call.allScore).toMatchObject({ songId: 501 });
  });

  it("☆10以下の楽曲(songDomain=allSongs)はallScoresのみ保存し、総合BPIは再計算しない", async () => {
    getSongMasterWithDefMock.mockResolvedValue([]);
    getAllLevelMasterMock.mockResolvedValue([nonBpiAllSong]);
    getLatestScoresMock.mockResolvedValue([]);
    getLatestAllScoresMock.mockResolvedValue([]);
    saveManualScoreUpdateMock.mockResolvedValue({ totalBpi: null, batchId: "manual-user-1-34-2026-09-17" });

    const { result } = await handleScoreManualUpdate(
      req({ songId: 900, songDomain: "allSongs", version: "34", exScore: 200 }),
    );

    expect(result.ok).toBe(true);
    const call = saveManualScoreUpdateMock.mock.calls[0][0];
    expect(call.score).toBeUndefined();
    expect(call.allScore).toMatchObject({ songId: 900, exScore: 200 });
    expect(call.computeTotalBpi).toBeUndefined();
    if (result.ok) {
      expect(result.body).toMatchObject({ scoresSaved: false, allScoresSaved: true, totalBpi: null });
    }
  });

  it("編集元(songDomain=bpi)側さえ改善していれば、allScores側の現在値がそれより高くても無条件でミラーする", async () => {
    getSongMasterWithDefMock.mockResolvedValue([bpiSong]);
    getAllLevelMasterMock.mockResolvedValue([allSongForBpiSong]);
    getLatestScoresMock.mockResolvedValue([
      { songId: 1, exScore: 400, clearState: "HARD", missCount: 3 },
    ]);
    // allScores側は既に900より高い自己ベストを持っている（scores側とズレているエッジケース）
    getLatestAllScoresMock.mockResolvedValue([
      { songId: 501, exScore: 950, clearState: "HARD", missCount: 0 },
    ]);
    saveManualScoreUpdateMock.mockResolvedValue({
      totalBpi: 30,
      batchId: "manual-user-1-34-2026-09-17",
    });

    const { result } = await handleScoreManualUpdate(
      req({ songId: 1, songDomain: "bpi", version: "34", exScore: 900 }),
    );

    expect(result.ok).toBe(true);
    const call = saveManualScoreUpdateMock.mock.calls[0][0];
    // 「見ている画面(scores)」の改善だけで両方が保存される。allScoresは900に
    // 無条件で揃えられ、独立判定によるスキップは起きない
    expect(call.score).toMatchObject({ songId: 1, exScore: 900 });
    expect(call.allScore).toMatchObject({ songId: 501, exScore: 900 });
    if (result.ok) {
      expect(result.body).toMatchObject({ scoresSaved: true, allScoresSaved: true });
    }
  });

  it("使用オプションとミスカウントを送ると、その値で保存する（#710）", async () => {
    getSongMasterWithDefMock.mockResolvedValue([bpiSong]);
    getAllLevelMasterMock.mockResolvedValue([allSongForBpiSong]);
    getLatestScoresMock.mockResolvedValue([{ songId: 1, exScore: 800, clearState: "HARD", missCount: 10 }]);
    getLatestAllScoresMock.mockResolvedValue([{ songId: 501, exScore: 800, clearState: "HARD", missCount: 10 }]);
    saveManualScoreUpdateMock.mockResolvedValue({ totalBpi: 50, batchId: "m-x" });

    const { result } = await handleScoreManualUpdate(
      req({ songId: 1, songDomain: "bpi", version: "34", exScore: 900, useOption: "RANDOM", missCount: 4 }),
    );

    expect(result.ok).toBe(true);
    const call = saveManualScoreUpdateMock.mock.calls[0][0];
    expect(call.score).toMatchObject({ exScore: 900, missCount: 4, useOption: "RANDOM", clearState: "HARD" });
    expect(call.allScore).toMatchObject({ exScore: 900, missCount: 4, useOption: "RANDOM" });
  });

  it("ミスカウントを送らなければ、最新の記録の値を引き継ぎ、使用オプションは触らない（#710）", async () => {
    getSongMasterWithDefMock.mockResolvedValue([bpiSong]);
    getAllLevelMasterMock.mockResolvedValue([allSongForBpiSong]);
    getLatestScoresMock.mockResolvedValue([{ songId: 1, exScore: 800, clearState: "HARD", missCount: 10 }]);
    getLatestAllScoresMock.mockResolvedValue([]);
    saveManualScoreUpdateMock.mockResolvedValue({ totalBpi: 50, batchId: "m-x" });

    await handleScoreManualUpdate(req({ songId: 1, songDomain: "bpi", version: "34", exScore: 900, missCount: null }));

    const call = saveManualScoreUpdateMock.mock.calls[0][0];
    expect(call.score).toMatchObject({ exScore: 900, missCount: 10 });
    expect(call.score.useOption).toBeUndefined();
  });

  it("EX が下がってもミスカウントが良くなれば保存し、EX はベストのまま、ミスカウントは少ないほうにする（#710）", async () => {
    getSongMasterWithDefMock.mockResolvedValue([bpiSong]);
    getAllLevelMasterMock.mockResolvedValue([allSongForBpiSong]);
    getLatestScoresMock.mockResolvedValue([{ songId: 1, exScore: 950, clearState: "HARD", missCount: 10 }]);
    getLatestAllScoresMock.mockResolvedValue([{ songId: 501, exScore: 950, clearState: "HARD", missCount: 10 }]);
    saveManualScoreUpdateMock.mockResolvedValue({ totalBpi: 50, batchId: "m-x" });

    const { result } = await handleScoreManualUpdate(req({ songId: 1, songDomain: "bpi", version: "34", exScore: 900, missCount: 3 }));

    expect(result.ok).toBe(true);
    const call = saveManualScoreUpdateMock.mock.calls[0][0];
    expect(call.score).toMatchObject({ exScore: 950, missCount: 3 });
    expect(call.allScore).toMatchObject({ exScore: 950, missCount: 3 });
  });

  it("EX もミスカウントも良くなっていなければ保存しない（#710）", async () => {
    getSongMasterWithDefMock.mockResolvedValue([bpiSong]);
    getAllLevelMasterMock.mockResolvedValue([allSongForBpiSong]);
    getLatestScoresMock.mockResolvedValue([{ songId: 1, exScore: 950, clearState: "HARD", missCount: 3 }]);
    getLatestAllScoresMock.mockResolvedValue([]);

    const { result } = await handleScoreManualUpdate(req({ songId: 1, songDomain: "bpi", version: "34", exScore: 900, missCount: 5 }));

    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(saveManualScoreUpdateMock).not.toHaveBeenCalled();
  });

  it("songDomain=allSongsで楽曲が見つからなければerr(404)", async () => {
    getSongMasterWithDefMock.mockResolvedValue([]);
    getAllLevelMasterMock.mockResolvedValue([]);
    getLatestScoresMock.mockResolvedValue([]);
    getLatestAllScoresMock.mockResolvedValue([]);
    const { result } = await handleScoreManualUpdate(
      req({ songId: 999, songDomain: "allSongs", version: "34", exScore: 900 }),
    );
    expect(result).toMatchObject({ ok: false, status: 404 });
  });
});

describe("handleScoreManualUpdate（プレビュー、#714）", () => {
  beforeEach(() => {
    getSongMasterWithDefMock.mockResolvedValue([bpiSong]);
    getAllLevelMasterMock.mockResolvedValue([allSongForBpiSong]);
    getLatestScoresMock.mockResolvedValue([{ songId: 1, exScore: 800, clearState: "HARD", missCount: 3 }]);
    getLatestAllScoresMock.mockResolvedValue([{ songId: 501, exScore: 800, clearState: "HARD", missCount: 3 }]);
    // 総合BPIは、観測した EX の合計 / 100 とみなす（計算の中身ではなく、保存前・保存後の扱いを確かめる）
    vi.spyOn(BpiCalculator, "calculateTotalBPI").mockImplementation((obs) => obs.reduce((a, o) => a + o.exScore, 0) / 100);
  });

  it("保存せず、保存した場合の EX・単曲BPI・総合BPIの保存前と保存後を返す。保存前は記録した最高値", async () => {
    findMaxTotalBpiMock.mockResolvedValue(7.5);
    const { result } = await handleScoreManualUpdate(req({ songId: 1, songDomain: "bpi", version: "34", exScore: 900, preview: true }));
    expect(saveManualScoreUpdateMock).not.toHaveBeenCalled();
    expect(findMaxTotalBpiMock).toHaveBeenCalledWith("user-1", "34");
    expect(result).toMatchObject({ ok: true, body: { preview: true, songId: 1, exScore: 900, improved: true, totalBpi: { before: 7.5, after: 9, delta: 1.5 } } });
  });

  it("記録がなければ、保存前はいまのスコアから算出する", async () => {
    findMaxTotalBpiMock.mockResolvedValue(null);
    const { result } = await handleScoreManualUpdate(req({ songId: 1, songDomain: "bpi", version: "34", exScore: 900, preview: true }));
    expect(result).toMatchObject({ ok: true, body: { totalBpi: { before: 8, after: 9, delta: 1 } } });
  });

  it("保存と同じく、これまでの最高値より下がらない（ラチェット）", async () => {
    findMaxTotalBpiMock.mockResolvedValue(20);
    const { result } = await handleScoreManualUpdate(req({ songId: 1, songDomain: "bpi", version: "34", exScore: 900, preview: true }));
    expect(result).toMatchObject({ ok: true, body: { totalBpi: { before: 20, after: 20, delta: 0 } } });
  });

  it("自己ベストを上回らなくても 400 にせず、improved: false と変わらない総合BPIを返す", async () => {
    findMaxTotalBpiMock.mockResolvedValue(8);
    const { result } = await handleScoreManualUpdate(req({ songId: 1, songDomain: "bpi", version: "34", exScore: 700, preview: true }));
    expect(saveManualScoreUpdateMock).not.toHaveBeenCalled();
    expect(result).toMatchObject({ ok: true, body: { improved: false, exScore: 800, totalBpi: { before: 8, after: 8, delta: 0 } } });
  });

  it("☆10以下は総合BPIの対象外（null）", async () => {
    getSongMasterWithDefMock.mockResolvedValue([]);
    getAllLevelMasterMock.mockResolvedValue([nonBpiAllSong]);
    const { result } = await handleScoreManualUpdate(req({ songId: 900, songDomain: "allSongs", version: "34", exScore: 200, preview: true }));
    expect(findMaxTotalBpiMock).not.toHaveBeenCalled();
    expect(result).toMatchObject({ ok: true, body: { improved: true, bpi: null, totalBpi: null } });
  });

  it("理論値を超える EX は、プレビューでも 400", async () => {
    const { result } = await handleScoreManualUpdate(req({ songId: 1, songDomain: "bpi", version: "34", exScore: 2001, preview: true }));
    expect(result).toMatchObject({ ok: false, status: 400 });
  });
});
