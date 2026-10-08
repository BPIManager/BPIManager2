import { describe, expect, it } from "vitest";
import { buildComparisonCsv } from "@/utils/analytics/comparisonCsv";
import type { SongWithRival } from "@/types/songs/score";

const base = {
  bpm: "150",
  releasedVersion: 33,
  kaidenAvg: 1700,
  wrScore: 1950,
  coef: 1.1,
  logId: 1,
  clearState: null,
  missCount: null,
  scoreAt: null,
} as const;

const rival = (exScore: number | null, bpi: number | null) => ({
  exScore,
  bpi,
  clearState: null,
  missCount: null,
  lastPlayed: null,
});

describe("buildComparisonCsv", () => {
  it("1ターゲット: 自分とターゲットのEX/BPIと差を出力する", () => {
    const songs: SongWithRival[] = [
      {
        ...base,
        songId: 1,
        title: "Song, with \"quote\"",
        difficulty: "ANOTHER",
        difficultyLevel: 12,
        notes: 1000,
        exScore: 1800,
        bpi: 50.123,
        rival: rival(1700, 40),
        exDiff: 100,
        bpiDiff: 10.12,
      },
    ];

    const csv = buildComparisonCsv(songs, ["アリーナ平均 A2"]);
    const [header, row] = csv.split("\r\n");

    expect(header).toBe(
      "title,difficulty,level,notes,you EX,you BPI,アリーナ平均 A2 EX,アリーナ平均 A2 BPI,アリーナ平均 A2 EX diff,アリーナ平均 A2 BPI diff",
    );
    expect(row).toBe('"Song, with ""quote""",ANOTHER,12,1000,1800,50.12,1700,40.00,100,10.12');
  });

  it("複数ターゲット: ターゲットごとの列が順に並び、未プレーは空欄になる", () => {
    const songs: SongWithRival[] = [
      {
        ...base,
        songId: 1,
        title: "A",
        difficulty: "HYPER",
        difficultyLevel: 11,
        notes: 800,
        exScore: 1500,
        bpi: 20,
        rival: rival(1400, 15),
        exDiff: 100,
        bpiDiff: 5,
        targets: [
          { rival: rival(1400, 15), exDiff: 100, bpiDiff: 5 },
          { rival: rival(null, null) },
        ],
      },
    ];

    const [header, row] = buildComparisonCsv(songs, ["R1", "R2"]).split("\r\n");

    expect(header.split(",")).toHaveLength(6 + 4 * 2);
    expect(row).toBe("A,HYPER,11,800,1500,20.00,1400,15.00,100,5.00,,,,");
  });
});
