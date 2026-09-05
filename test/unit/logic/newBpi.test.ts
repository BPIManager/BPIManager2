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

  it("全一が未設定の楽曲はnullを返す（BPI100のアンカーが組めないため）", () => {
    const [songId] = [...newBpiSongParamMap.keys()];
    expect(
      NewBpiCalculator.calc(1000, {
        songId,
        notes: NOTES,
        kaidenAvg: KAIDEN_AVG,
        wrScore: null,
      }),
    ).toBeNull();
  });

  it("皆伝平均が未設定でも計算できる（BPI0は全曲共通の定数を使うため）", () => {
    const [songId] = [...newBpiSongParamMap.keys()];
    const bpi = NewBpiCalculator.calc(WR_SCORE, {
      songId,
      notes: NOTES,
      kaidenAvg: null,
      wrScore: WR_SCORE,
    });
    expect(bpi).not.toBeNull();
  });

  it("BPI100=全一という原典の定義を崩さない（曲ごとに再アンカー）", () => {
    const [songId] = [...newBpiSongParamMap.keys()];
    const song = { songId, notes: NOTES, kaidenAvg: KAIDEN_AVG, wrScore: WR_SCORE };

    const atWr = NewBpiCalculator.calc(WR_SCORE, song)!;
    expect(atWr).toBeCloseTo(100, 1);
    expect(NewBpiCalculator.calcFromBPI(100, song)!).toBeCloseTo(WR_SCORE, 0);
  });

  it("BPI0は全曲共通の定数(issue #302)であり、必ずしも皆伝平均ちょうどにはならない", () => {
    const [songId] = [...newBpiSongParamMap.keys()];
    const song = { songId, notes: NOTES, kaidenAvg: KAIDEN_AVG, wrScore: WR_SCORE };

    const atKaidenAvg = NewBpiCalculator.calc(KAIDEN_AVG, song)!;
    // 皆伝平均アンカーの曲間ばらつきは実測で小さい(issue #299実測: 0.53SD程度)ため、
    // 0からの乖離もその範囲に収まることを緩くチェックする(ゼロぴったりは要求しない)
    expect(Math.abs(atKaidenAvg)).toBeLessThan(30);
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
