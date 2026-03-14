import { describe, it, expect } from "vitest";
import definitions from "./resources/definitions.json";
import { IBpiBasicSongData, BpiCalculator } from "@/lib/bpi";

describe("BpiCalculator ロジックテスト", () => {
  const songs = definitions.rows;

  // 1. 基本的な指標の検証
  describe("基本指標の検証", () => {
    it("皆伝平均スコアを入力した時、BPIがほぼ0になること", () => {
      songs.slice(0, 100).forEach((songData: any) => {
        const song: IBpiBasicSongData = {
          notes: Number(songData.notes),
          kaidenAvg: Number(songData.avg),
          wrScore: Number(songData.wr),
          coef: Number(songData.coef),
        };
        if (song.kaidenAvg && song.kaidenAvg > 0) {
          const bpi = BpiCalculator.calc(song.kaidenAvg, song);
          expect(bpi).toBeGreaterThanOrEqual(-0.02);
          expect(bpi).toBeLessThanOrEqual(0.02);
        }
      });
    });

    it("歴代最高スコアを入力した時、BPIがほぼ100になること", () => {
      songs.slice(0, 100).forEach((songData: any) => {
        const song: IBpiBasicSongData = {
          notes: Number(songData.notes),
          kaidenAvg: Number(songData.avg),
          wrScore: Number(songData.wr),
          coef: Number(songData.coef),
        };
        if (song.wrScore && song.wrScore > 0) {
          const bpi = BpiCalculator.calc(song.wrScore, song);
          expect(bpi).toBeCloseTo(100, 1);
        }
      });
    });
  });

  // 2. スコアの境界値テスト
  describe("スコア境界値の検証", () => {
    const sampleSong = {
      notes: 1000,
      kaidenAvg: 1500,
      wrScore: 1900,
      coef: 1.175,
    };
    const maxScore = sampleSong.notes * 2;

    it("スコア0のとき、最小値の-15になること", () => {
      expect(BpiCalculator.calc(0, sampleSong)).toBe(-15);
    });

    it("理論最大スコア（MAX）のとき、BPIが計算可能であり高得点であること", () => {
      const bpi = BpiCalculator.calc(maxScore, sampleSong);
      expect(bpi).not.toBeNull();
      expect(bpi).toBeGreaterThan(100);
    });

    it("理論最大スコアを超えた場合、nullを返すこと", () => {
      expect(BpiCalculator.calc(maxScore + 1, sampleSong)).toBeNull();
    });

    it("負のスコアの場合、-15を返すこと", () => {
      expect(BpiCalculator.calc(-1, sampleSong)).toBe(-15);
    });
  });

  // 3. データ異常・エッジケース
  describe("異常系・特殊データの検証", () => {
    it("皆伝平均と歴代最高が同じスコアの場合、安全のため一律BPI 0になること", () => {
      const edgeSong = {
        notes: 1000,
        kaidenAvg: 1800,
        wrScore: 1800,
        coef: 1.175,
      };
      expect(BpiCalculator.calc(1800, edgeSong)).toBe(0);
      expect(BpiCalculator.calc(1900, edgeSong)).toBe(0);
      expect(BpiCalculator.calc(1700, edgeSong)).toBe(0);
    });

    it("皆伝平均が歴代最高より高い（データ異常）場合でもエラーにならないこと", () => {
      const brokenSong = {
        notes: 1000,
        kaidenAvg: 1900,
        wrScore: 1500,
        coef: 1.175,
      };
      const result = BpiCalculator.calc(1700, brokenSong);
      expect(result).not.toBeNaN();
    });

    it("Notesが0の場合、計算結果が安全に処理されること", () => {
      const zeroSong = { notes: 0, kaidenAvg: 0, wrScore: 0 };
      expect(BpiCalculator.calc(100, zeroSong)).toBe(-15);
      expect(BpiCalculator.calcFromBPI(100, zeroSong)).toBe(0);
    });

    it("coefが0以下の時、デフォルト値が適用されること", () => {
      const noCoefSong = {
        notes: 1000,
        kaidenAvg: 1500,
        wrScore: 1800,
        coef: -1,
      };
      const result = BpiCalculator.calc(1600, noCoefSong);
      expect(result).not.toBeNull();
      expect(result).not.toBeNaN();
    });
  });

  // 4. 逆算ロジック（BPI -> Score）の検証
  describe("逆算ロジックの検証", () => {
    const song = { notes: 1000, kaidenAvg: 1500, wrScore: 1900, coef: 1.175 };

    it("BPI 0を指定した時、皆伝平均スコアが返ること", () => {
      expect(BpiCalculator.calcFromBPI(0, song)).toBe(song.kaidenAvg);
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
    it("全曲マイナスBPIの場合、総合BPIもマイナスになること", () => {
      const total = BpiCalculator.calculateTotalBPI([-10, -20, -5], 3);
      expect(total).toBeLessThan(0);
    });

    it("未プレイ曲（-15）が含まれる場合、正しく集計されること", () => {
      const bpis = [50, 50, -15];
      const total = BpiCalculator.calculateTotalBPI(bpis, 3);
      expect(total).toBeLessThan(50);
      expect(total).toBeGreaterThan(0);
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
