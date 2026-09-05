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

  describe("gamma補正（全一が極端に遠い曲のカーブ歪み対策）", () => {
    // 全一がほぼ理論値(m)の曲は、mu/sigmaで測るとz100が極端な外れ値になり
    // やすい(issue #299〜304検証で実データにより確認済み)。
    const EXTREME_WR_SCORE = Math.round(M * 0.999);

    it("全一が極端に遠い曲でもBPI(全一)=100を厳密に保つ", () => {
      const [songId] = [...newBpiSongParamMap.keys()];
      const song = { songId, notes: NOTES, kaidenAvg: KAIDEN_AVG, wrScore: EXTREME_WR_SCORE };
      const atWr = NewBpiCalculator.calc(EXTREME_WR_SCORE, song)!;
      expect(atWr).toBeCloseTo(100, 1);
    });

    it("全一が極端に遠い曲では、通常曲より皆伝平均超えのBPIが高く補正される", () => {
      const [songId] = [...newBpiSongParamMap.keys()];
      const normalSong = { songId, notes: NOTES, kaidenAvg: KAIDEN_AVG, wrScore: WR_SCORE };
      const extremeSong = { songId, notes: NOTES, kaidenAvg: KAIDEN_AVG, wrScore: EXTREME_WR_SCORE };

      // BPI0の実際のクロス地点はこのテスト用songIdの実際のmu/sigma次第で
      // KAIDEN_AVGから多少ずれうるため、皆伝平均をはっきり超える位置を使う
      const midScore = KAIDEN_AVG + Math.round((WR_SCORE - KAIDEN_AVG) * 0.8);
      const normalParams = NewBpiCalculator.getSongParams(normalSong)!;
      const extremeParams = NewBpiCalculator.getSongParams(extremeSong)!;

      // 全一がより遠い(gapが大きい)曲ほどgammaは緩和方向(より小さく)になる
      expect(extremeParams.gamma).toBeLessThan(normalParams.gamma);

      const normalBpi = NewBpiCalculator.calc(midScore, normalSong)!;
      const extremeBpiCorrected = NewBpiCalculator.calc(midScore, extremeSong)!;
      expect(extremeBpiCorrected).toBeGreaterThan(0);
      // gamma補正が無ければ(z100−z0)が大きい分BPIはnormalBpiよりずっと低く
      // 圧縮されるはずだが、補正により同程度の水準まで引き上げられる
      expect(extremeBpiCorrected).toBeGreaterThan(normalBpi * 0.5);
    });

    it("gammaで曲間の式自体は変えない（同じ計算式・同じ全曲共通定数から算出）", () => {
      const [songId] = [...newBpiSongParamMap.keys()];
      const song = { songId, notes: NOTES, kaidenAvg: KAIDEN_AVG, wrScore: WR_SCORE };
      // calc/calcFromBPIが相互に整合していること(同じgammaで往復できること)を確認
      const bpi = NewBpiCalculator.calc(2700, song)!;
      const backToScore = NewBpiCalculator.calcFromBPI(bpi, song)!;
      // calc()側の丸め(小数第2位)がgammaの累乗を通って増幅されうるため、
      // 数点程度のずれは許容する
      expect(Math.abs(backToScore - 2700)).toBeLessThan(3);
    });
  });
});
