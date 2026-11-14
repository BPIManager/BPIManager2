import { describe, it, expect } from "vitest";
import {
  bestEverRowToUnplayedSong,
  mergeFixedTarget,
  type BestEverRow,
} from "@/hooks/analytics/comparisonRows";

const row: BestEverRow = {
  songId: 1,
  title: "past only",
  difficulty: "ANOTHER",
  difficultyLevel: 12,
  notes: 1000,
  bpm: "150",
  releasedVersion: 30,
  bestExScore: 1800,
  bestBpi: 12.34,
  bestVersion: "32",
  wrScore: 1990,
  kaidenAvg: 1700,
  coef: 1,
  mu: 1,
  sigma: 1,
  residualVar: 1,
};

describe("bestEverRowToUnplayedSong", () => {
  it("今作未プレイ（スコアなし）の行として組み立てる", () => {
    const song = bestEverRowToUnplayedSong(row);
    expect(song).toMatchObject({
      songId: 1,
      title: "past only",
      exScore: null,
      bpi: null,
      clearState: null,
    });
  });

  it("歴代ベスト比較に載せると、自分は未プレイで比較側のスコアとバージョンを持つ", () => {
    const merged = mergeFixedTarget(
      bestEverRowToUnplayedSong(row),
      row.bestExScore,
      row.bestBpi,
      row.bestVersion,
    );
    expect(merged.exScore).toBeNull();
    expect(merged.rival).toMatchObject({ exScore: 1800, bpi: 12.34, version: "32" });
    expect(merged.exDiff).toBeUndefined();
  });
});
