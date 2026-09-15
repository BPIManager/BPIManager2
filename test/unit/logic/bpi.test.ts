import { describe, it, expect } from "vitest";
import { tOf } from "@bpim/bpicalc";
import definitions from "../../resources/definitions.json";
import { BpiCalculator } from "@/lib/bpi";
import { IBpiBasicSongData, IBpiScoreObservation } from "@/types/songs/bpi";
import { NEW_BPI_Z0 } from "@/constants/iidx/newBpi/modelConstants";

/**
 * V2(分布ベース)のmu/sigmaは本来ALS推定で得られる値だが、テストでは
 * 「皆伝平均スコアの時点でグローバル定数z0を取る」ように単曲ごとに
 * 合成する(sigma=1固定、muを逆算)。これによりkaidenAvg→BPI0、
 * wrScore→BPI100という直感的な境界が再現でき、V1時代のアンカー方式の
 * テストをV2でも書ける。
 */
function withV2Params(song: {
  notes: number;
  kaidenAvg: number | null;
  wrScore: number | null;
  coef?: number | null;
}): IBpiBasicSongData {
  if (song.kaidenAvg === null) {
    return { ...song, mu: null, sigma: null, residualVar: null };
  }
  const m = song.notes * 2;
  const sigma = 1;
  const mu = tOf(song.kaidenAvg, m) - NEW_BPI_Z0;
  return { ...song, mu, sigma, residualVar: null };
}

describe("BpiCalculator ロジックテスト", () => {
  const songs = definitions.rows;

  // 1. 基本的な指標の検証
  describe("基本指標の検証", () => {
    it("皆伝平均スコアを入力した時、BPIがほぼ0になること", () => {
      songs.slice(0, 100).forEach((songData) => {
        const song = withV2Params({
          notes: Number(songData.notes),
          kaidenAvg: Number(songData.kaidenAvg),
          wrScore: Number(songData.wrScore),
          coef: Number(songData.coef),
        });
        if (song.kaidenAvg && song.kaidenAvg > 0) {
          const bpi = BpiCalculator.calc(song.kaidenAvg, song);
          expect(bpi).not.toBeNull();
          expect(bpi as number).toBeGreaterThanOrEqual(-0.02);
          expect(bpi as number).toBeLessThanOrEqual(0.02);
        }
      });
    });

    it("歴代最高スコアを入力した時、BPIがほぼ100になること", () => {
      songs.slice(0, 100).forEach((songData) => {
        const song = withV2Params({
          notes: Number(songData.notes),
          kaidenAvg: Number(songData.kaidenAvg),
          wrScore: Number(songData.wrScore),
          coef: Number(songData.coef),
        });
        if (song.wrScore && song.wrScore > 0) {
          const bpi = BpiCalculator.calc(song.wrScore, song);
          expect(bpi).toBeCloseTo(100, 1);
        }
      });
    });
  });

  // 2. スコアの境界値テスト
  describe("スコア境界値の検証", () => {
    const sampleSong = withV2Params({
      notes: 1000,
      kaidenAvg: 1500,
      wrScore: 1900,
      coef: 1.175,
    });
    const maxScore = sampleSong.notes * 2;

    it("スコア0のとき、最小値の-15になること", () => {
      expect(BpiCalculator.calc(0, sampleSong)).toBe(-15);
    });

    it("理論最大スコア（MAX）のとき、BPIが計算可能であり高得点であること", () => {
      const bpi = BpiCalculator.calc(maxScore, sampleSong);
      expect(bpi).not.toBeNull();
      expect(bpi).toBeGreaterThan(100);
    });

    it("理論最大スコアを超えた場合、理論最大スコアと同じ値にクランプされること", () => {
      // V2は入力スコアを[0, m]にクランプしてから計算するため(V1のような
      // 範囲外null判定は無い)、最大値を超えても最大値と同じBPIになる
      const atMax = BpiCalculator.calc(maxScore, sampleSong);
      const overMax = BpiCalculator.calc(maxScore + 1, sampleSong);
      expect(overMax).toBe(atMax);
    });

    it("負のスコアの場合、-15を返すこと", () => {
      expect(BpiCalculator.calc(-1, sampleSong)).toBe(-15);
    });
  });

  // 3. データ異常・エッジケース
  describe("異常系・特殊データの検証", () => {
    it("皆伝平均と歴代最高が同じスコアの場合、アンカーが縮退しnullになること", () => {
      // z100(=z(wrScore)) が z0 と一致し、(z-z0)/(z100-z0) が0除算になるため
      // 計算不能(null)として扱う
      const edgeSong = withV2Params({
        notes: 1000,
        kaidenAvg: 1800,
        wrScore: 1800,
        coef: 1.175,
      });
      expect(BpiCalculator.calc(1800, edgeSong)).toBeNull();
      expect(BpiCalculator.calc(1900, edgeSong)).toBeNull();
      expect(BpiCalculator.calc(1700, edgeSong)).toBeNull();
    });

    it("皆伝平均が歴代最高より高い（データ異常）場合でもエラーにならないこと", () => {
      const brokenSong = withV2Params({
        notes: 1000,
        kaidenAvg: 1900,
        wrScore: 1500,
        coef: 1.175,
      });
      const result = BpiCalculator.calc(1700, brokenSong);
      expect(result).not.toBeNull();
      expect(result).not.toBeNaN();
    });

    it("Notesが0の場合、計算不能としてnullを返すこと", () => {
      const zeroSong: IBpiBasicSongData = {
        notes: 0,
        kaidenAvg: 0,
        wrScore: 0,
        mu: 0,
        sigma: 1,
        residualVar: null,
      };
      expect(BpiCalculator.calc(100, zeroSong)).toBeNull();
      expect(BpiCalculator.calcFromBPI(100, zeroSong)).toBeNull();
    });

    it("mu/sigmaが無い（ALS対象外・未計算）曲は、calc・calcFromBPI共にnullを返すこと", () => {
      const noParamsSong: IBpiBasicSongData = {
        notes: 1000,
        kaidenAvg: 1500,
        wrScore: 1800,
      };
      expect(BpiCalculator.calc(900, noParamsSong)).toBeNull();
      expect(BpiCalculator.calcFromBPI(50, noParamsSong)).toBeNull();
    });

    it("wrScoreがnullの場合、mu/sigmaがあってもcalcがnullを返すこと", () => {
      const noWrScoreSong = {
        ...withV2Params({ notes: 1000, kaidenAvg: 1500, wrScore: 1800 }),
        wrScore: null,
      };
      expect(BpiCalculator.calc(900, noWrScoreSong)).toBeNull();
    });

    it("coefがnull（未設定）でもデフォルト係数で計算できること", () => {
      const noCoefSong = withV2Params({
        notes: 1000,
        kaidenAvg: 1500,
        wrScore: 1800,
        coef: null,
      });
      const result = BpiCalculator.calc(1600, noCoefSong);
      expect(result).not.toBeNull();
      expect(result).not.toBeNaN();
    });
  });

  // 4. 逆算ロジック（BPI -> Score）の検証
  describe("逆算ロジックの検証", () => {
    const song = withV2Params({
      notes: 1000,
      kaidenAvg: 1500,
      wrScore: 1900,
      coef: 1.175,
    });

    it("BPI 0を指定した時、皆伝平均スコア相当が返ること", () => {
      // ceiled(デフォルトtrue)のため浮動小数の丸め誤差分だけ切り上がりうる
      expect(BpiCalculator.calcFromBPI(0, song, false)).toBeCloseTo(
        song.kaidenAvg!,
        6,
      );
    });

    it("BPI 100を指定した時、歴代最高スコアが返ること", () => {
      expect(BpiCalculator.calcFromBPI(100, song)).toBe(song.wrScore);
    });

    it("極端に高いBPIを指定した時、理論最大スコアにクランプされること", () => {
      expect(BpiCalculator.calcFromBPI(999, song)).toBe(song.notes * 2);
    });

    it("理論最大スコアちょうどを逆算できること", () => {
      const maxBpi = BpiCalculator.calc(song.notes * 2, song) as number;
      const score = BpiCalculator.calcFromBPI(maxBpi, song);
      expect(score).toBe(song.notes * 2);
    });

    it("極端に低いBPI（マイナス）を指定した時、0以上にクランプされること", () => {
      expect(BpiCalculator.calcFromBPI(-999, song)).toBeGreaterThanOrEqual(0);
    });
  });

  // 5. 総合統計の検証
  describe("総合BPI・順位推定の検証", () => {
    const master: (IBpiBasicSongData & { songId: number })[] = [1, 2, 3].map(
      (songId) => ({
        songId,
        ...withV2Params({
          notes: 1000,
          kaidenAvg: 1500,
          wrScore: 1900,
          coef: 1.175,
        }),
      }),
    );

    it("全曲低スコアの場合、総合BPIが床（-15）になること", () => {
      const observations: IBpiScoreObservation[] = master.map((s) => ({
        songId: s.songId,
        notes: s.notes,
        exScore: 1000,
      }));
      const total = BpiCalculator.calculateTotalBPI(observations, master);
      expect(total).toBe(-15);
    });

    it("未プレイ曲が含まれる場合、潜在スキルからの予測を含めて集計されること", () => {
      // songId:3は未観測(=未プレイ)。潜在スキルは残り2曲の高スコアから
      // 推定され、その予測込みで総合BPIが決まる（単曲BPIより低く、床よりは高い）
      const observations: IBpiScoreObservation[] = [
        { songId: 1, notes: 1000, exScore: 1850 },
        { songId: 2, notes: 1000, exScore: 1850 },
      ];
      const singleBpi = BpiCalculator.calc(1850, master[0])!;
      const total = BpiCalculator.calculateTotalBPI(observations, master);
      expect(total).toBeLessThan(singleBpi);
      expect(total).toBeGreaterThan(0);
    });

    it("有効な観測が1件も無ければ床（-15）になること", () => {
      const total = BpiCalculator.calculateTotalBPI([], master);
      expect(total).toBe(-15);
    });

    it("推定順位がBPI 100で1位、BPI 0付近で皆伝平均順位になること", () => {
      expect(BpiCalculator.estimateRank(100)).toBe(1);
      expect(BpiCalculator.estimateRank(0)).toBeGreaterThan(2000);
      expect(BpiCalculator.estimateRank(-15)).toBeGreaterThan(
        BpiCalculator.estimateRank(0),
      );
    });
  });
});
