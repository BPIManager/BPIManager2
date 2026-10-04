import { describe, it, expect, vi, beforeEach } from "vitest";

const saveImportResultsMock = vi.fn();
const getSongMasterMock = vi.fn();
const getLatestScoresMock = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    transaction: () => ({
      execute: (cb: (trx: unknown) => unknown) => cb({}),
    }),
  },
}));
vi.mock("@/lib/db/shared/userWriteLock", () => ({
  lockUserForWrite: vi.fn(),
}));
vi.mock("@/lib/db/domains/songs/master", () => ({
  songMasterRepo: { getSongMasterWithDef: () => getSongMasterMock() },
}));
vi.mock("@/lib/db/domains/allSongs", () => ({
  allSongsRepo: { getAllLevelMaster: async () => [] },
}));
vi.mock("@/lib/db/domains/scores/latest", () => ({
  latestScoresRepo: { getLatestScores: () => getLatestScoresMock() },
}));
vi.mock("@/lib/db/domains/allScores", () => ({
  allScoresRepo: { getLatestAllScores: async () => [] },
}));
vi.mock("@/lib/db/domains/logs/totalBpi", () => ({
  logTotalBpiRepo: { getLatestTotalBpi: async () => undefined },
}));
vi.mock("@/lib/db/orchestrators/bpiImport", () => ({
  saveImportResults: (...a: unknown[]) => saveImportResultsMock(...a),
}));

const { registerUpdateMyScore } = await import(
  "@/lib/mcp/tools/updateMyScore"
);

type ToolHandler = (args: {
  songId: number;
  version: string;
  exScore: number;
  clearState: string;
  missCount?: number;
}) => Promise<{ content: { text: string }[] }>;

function captureHandler(): ToolHandler {
  let handler: ToolHandler | undefined;
  registerUpdateMyScore(
    {
      registerTool: (_name: string, _cfg: unknown, h: ToolHandler) => {
        handler = h;
      },
    } as never,
    "user-1",
  );
  return handler!;
}

const SONG = {
  songId: 1,
  defId: 10,
  title: "テスト曲",
  difficulty: "ANOTHER",
  difficultyLevel: 12,
  notes: 1000,
  kaidenAvg: 1500,
  wrScore: 1900,
  coef: 1.175,
  mu: 0,
  sigma: 1,
  residualVar: null,
};

describe("update_my_score", () => {
  beforeEach(() => {
    saveImportResultsMock.mockReset();
    getSongMasterMock.mockReset().mockResolvedValue([SONG]);
    getLatestScoresMock.mockReset().mockResolvedValue([]);
  });

  it("BPI定義のない楽曲は更新せず書き込みを行わないこと", async () => {
    const handler = captureHandler();
    const res = await handler({
      songId: 999,
      version: "34",
      exScore: 100,
      clearState: "CLEAR",
    });
    expect(res.content[0].text).toContain("見つかりませんでした");
    expect(saveImportResultsMock).not.toHaveBeenCalled();
  });

  it("exScoreが理論値(notes*2)を超える場合は拒否し、書き込みを行わないこと", async () => {
    const handler = captureHandler();
    const res = await handler({
      songId: 1,
      version: "34",
      exScore: 2001,
      clearState: "CLEAR",
    });
    expect(res.content[0].text).toContain("理論上の最大値");
    expect(saveImportResultsMock).not.toHaveBeenCalled();
  });

  it("理論値ちょうどは拒否されないこと", async () => {
    saveImportResultsMock.mockResolvedValue({ totalBpi: 10 });
    const handler = captureHandler();
    const res = await handler({
      songId: 1,
      version: "34",
      exScore: 2000,
      clearState: "FULLCOMBO CLEAR",
    });
    expect(res.content[0].text).toContain("更新しました");
    expect(saveImportResultsMock).toHaveBeenCalledTimes(1);
  });

  it("既存の自己ベストを上回らない場合は「更新しませんでした」を返し、書き込みを行わないこと", async () => {
    getLatestScoresMock.mockResolvedValue([
      { songId: 1, exScore: 1800, clearState: "HARD CLEAR", missCount: 3 },
    ]);
    const handler = captureHandler();
    const res = await handler({
      songId: 1,
      version: "34",
      exScore: 1700,
      clearState: "CLEAR",
      missCount: 10,
    });
    expect(res.content[0].text).toContain("更新しませんでした");
    expect(saveImportResultsMock).not.toHaveBeenCalled();
  });
});
