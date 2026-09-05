import { describe, it, expect } from "vitest";
import { NewBpiCalculator } from "@/lib/bpi/newBpi";
import { newBpiSongParamMap } from "@/constants/iidx/newBpi/songParams";

const NOTES = 1500;
const M = NOTES * 2;
const KAIDEN_AVG = 2500;
const WR_SCORE = 2950;

describe("NewBpiCalculator ロジックテスト（issue #299〜304 検証用）", () => {
  it("パラメータ未収録の楽曲はnullを返す", () => {
    const unknownSongId = -1;
    expect(NewBpiCalculator.hasParams(unknownSongId)).toBe(false);
    expect(
      NewBpiCalculator.calc(1000, {
        songId: unknownSongId,
        notes: NOTES,
        kaidenAvg: KAIDEN_AVG,
        wrScore: WR_SCORE,
      }),
    ).toBeNull();
  });

  it("皆伝平均・全一が未設定の楽曲もnullを返す（曲ごとのアンカーが組めないため）", () => {
    const [songId] = [...newBpiSongParamMap.keys()];
    expect(
      NewBpiCalculator.calc(1000, {
        songId,
        notes: NOTES,
        kaidenAvg: null,
        wrScore: WR_SCORE,
      }),
    ).toBeNull();
  });

  it("BPI0=皆伝平均、BPI100=全一という原典の定義を崩さない（曲ごとに再アンカー）", () => {
    const [songId] = [...newBpiSongParamMap.keys()];
    const song = { songId, notes: NOTES, kaidenAvg: KAIDEN_AVG, wrScore: WR_SCORE };

    const atKaidenAvg = NewBpiCalculator.calc(KAIDEN_AVG, song)!;
    const atWr = NewBpiCalculator.calc(WR_SCORE, song)!;
    expect(atKaidenAvg).toBeCloseTo(0, 1);
    expect(atWr).toBeCloseTo(100, 1);

    // 逆算(calcFromBPI)でも同じアンカーが成り立つこと
    expect(NewBpiCalculator.calcFromBPI(0, song)!).toBeCloseTo(KAIDEN_AVG, 0);
    expect(NewBpiCalculator.calcFromBPI(100, song)!).toBeCloseTo(WR_SCORE, 0);
  });

  it("スコアが高いほど新方式BPIも高くなる（単調性）", () => {
    const [songId] = [...newBpiSongParamMap.keys()];
    const song = { songId, notes: NOTES, kaidenAvg: KAIDEN_AVG, wrScore: WR_SCORE };
    const low = NewBpiCalculator.calc(2200, song)!;
    const high = NewBpiCalculator.calc(2800, song)!;
    expect(high).toBeGreaterThan(low);
  });

  it("現行実装と同じく-15を下限としてクランプする（暫定対応）", () => {
    const [songId] = [...newBpiSongParamMap.keys()];
    const song = { songId, notes: NOTES, kaidenAvg: KAIDEN_AVG, wrScore: WR_SCORE };
    const veryLow = NewBpiCalculator.calc(1, song)!;
    expect(veryLow).toBe(NewBpiCalculator.BPI_FLOOR);
  });

  it("m以下の範囲に丸めてEXスコアを逆算する", () => {
    const [songId] = [...newBpiSongParamMap.keys()];
    const song = { songId, notes: NOTES, kaidenAvg: KAIDEN_AVG, wrScore: WR_SCORE };
    expect(NewBpiCalculator.calcFromBPI(1000, song)).toBeLessThanOrEqual(M);
    expect(NewBpiCalculator.calcFromBPI(-1000, song)).toBeGreaterThanOrEqual(0);
  });
});
