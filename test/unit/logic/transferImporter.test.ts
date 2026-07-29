import { describe, it, expect, vi } from "vitest";
import { SongLookup } from "@/lib/transfer/songLookup";
import type { SongMaster } from "@/types/songs/master";

const { getSongMasterWithDefMock, importFromBPIMMock } = vi.hoisted(() => ({
  getSongMasterWithDefMock: vi.fn(),
  importFromBPIMMock: vi.fn(),
}));

vi.mock("@/lib/db/bpi", () => ({
  bpiRepo: {
    getSongMasterWithDef: getSongMasterWithDefMock,
    importFromBPIM: importFromBPIMMock,
  },
}));

const { BpiImportService } = await import("@/lib/transfer/importer");

const songMaster: SongMaster = [
  {
    songId: 1,
    title: "冥",
    notes: 1000,
    difficulty: "ANOTHER",
    difficultyLevel: 12,
    defId: 1,
    wrScore: 1900,
    kaidenAvg: 1000,
    coef: 1.175,
  },
];

describe("SongLookup", () => {
  it("タイトルと難易度(大文字小文字無視)で楽曲を検索できること", () => {
    const lookup = new SongLookup(songMaster);
    expect(lookup.find("冥", "another")?.songId).toBe(1);
    expect(lookup.find("冥", "ANOTHER")?.songId).toBe(1);
  });

  it("一致しない場合はundefinedを返すこと", () => {
    const lookup = new SongLookup(songMaster);
    expect(lookup.find("存在しない曲", "ANOTHER")).toBeUndefined();
  });
});

describe("BpiImportService.mapClearState", () => {
  const service = new BpiImportService();

  it.each([
    [0, "FAILED"],
    [1, "ASSIST CLEAR"],
    [2, "EASY CLEAR"],
    [3, "CLEAR"],
    [4, "HARD CLEAR"],
    [5, "EX HARD CLEAR"],
    [6, "FULLCOMBO CLEAR"],
    [7, "NO PLAY"],
  ])("state=%i のとき %s を返すこと", (state, expected) => {
    expect(service.mapClearState(state)).toBe(expected);
  });

  it("undefinedのときNO PLAYを返すこと", () => {
    expect(service.mapClearState(undefined)).toBe("NO PLAY");
  });

  it("数値文字列も数値と同様に変換できること", () => {
    expect(service.mapClearState("4")).toBe("HARD CLEAR");
  });
});

describe("BpiImportService.saveMultipleFirestoreData", () => {
  it("スコア履歴をバッチ化してimportFromBPIMへ渡すこと", async () => {
    getSongMasterWithDefMock.mockResolvedValue(songMaster);
    importFromBPIMMock.mockResolvedValue(undefined);

    const service = new BpiImportService();
    const result = await service.saveMultipleFirestoreData("user-1", [
      {
        version: "33",
        data: {
          scoresHistory: [
            {
              title: "冥",
              difficulty: "ANOTHER",
              exScore: 1800,
              updatedAt: "2025-06-01T12:00:00Z",
            },
          ],
          scores: {
            "冥_another": {
              title: "冥",
              difficulty: "ANOTHER",
              clearState: 4,
              missCount: 5,
            },
          },
        },
      },
    ]);

    expect(result).toEqual({ totalProcessed: 1 });
    expect(importFromBPIMMock).toHaveBeenCalledTimes(1);

    const call = importFromBPIMMock.mock.calls[0][0];
    expect(call.userId).toBe("user-1");
    expect(call.scoreUpdates).toHaveLength(1);
    expect(call.scoreUpdates[0]).toMatchObject({
      songId: 1,
      exScore: 1800,
      clearState: "HARD CLEAR",
      missCount: 5,
      version: "33",
    });
    expect(call.statusLogs).toHaveLength(1);
  });

  it("楽曲マスタに存在しない曲はスキップされること", async () => {
    getSongMasterWithDefMock.mockResolvedValue(songMaster);
    importFromBPIMMock.mockResolvedValue(undefined);

    const service = new BpiImportService();
    const result = await service.saveMultipleFirestoreData("user-1", [
      {
        version: "33",
        data: {
          scoresHistory: [
            {
              title: "存在しない曲",
              difficulty: "ANOTHER",
              exScore: 1800,
              updatedAt: "2025-06-01T12:00:00Z",
            },
          ],
          scores: {},
        },
      },
    ]);

    expect(result).toEqual({ totalProcessed: 0 });
  });

  it("updatedAtが不正な日付のエントリはスキップされること", async () => {
    getSongMasterWithDefMock.mockResolvedValue(songMaster);
    importFromBPIMMock.mockResolvedValue(undefined);

    const service = new BpiImportService();
    const result = await service.saveMultipleFirestoreData("user-1", [
      {
        version: "33",
        data: {
          scoresHistory: [
            {
              title: "冥",
              difficulty: "ANOTHER",
              exScore: 1800,
              updatedAt: "not-a-date",
            },
          ],
          scores: {},
        },
      },
    ]);

    expect(result).toEqual({ totalProcessed: 0 });
  });
});
