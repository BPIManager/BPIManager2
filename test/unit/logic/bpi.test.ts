import { describe, it, expect } from "vitest";
import definitions from "../../resources/definitions.json";
import { BpiCalculator } from "@/lib/bpi";
import { IBpiBasicSongData } from "@/types/songs/bpi";

describe("BpiCalculator ロジックテスト", () => {
  const songs = definitions.rows;

  // 1. 基本的な指標の検証
  describe("基本指標の検証", () => {
    it("皆伝平均スコアを入力した時、BPIがほぼ0になること", () => {
      songs.slice(0, 100).forEach((songData) => {
        const song: IBpiBasicSongData = {
          notes: Number(songData.notes),
          kaidenAvg: Number(songData.kaidenAvg),
          wrScore: Number(songData.wrScore),
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
      songs.slice(0, 100).forEach((songData) => {
        const song: IBpiBasicSongData = {
          notes: Number(songData.notes),
          kaidenAvg: Number(songData.kaidenAvg),
          wrScore: Number(songData.wrScore),
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

    it("kaidenAvg/wrScoreが0（null以外）の場合、calcとcalcFromBPIで一貫して有効な値として扱われること", () => {
      const zeroKaidenSong = { notes: 1000, kaidenAvg: 0, wrScore: 1800 };
      const zeroWrScoreSong = { notes: 1000, kaidenAvg: 1500, wrScore: 0 };

      expect(BpiCalculator.calc(900, zeroKaidenSong)).not.toBe(-15);
      // wrScore(歴代最高)が0でも、皆伝平均スコア相当を入力すればBPIはほぼ0になる
      expect(BpiCalculator.calc(1500, zeroWrScoreSong)).toBeCloseTo(0, 1);
      expect(
        BpiCalculator.calcFromBPI(50, zeroKaidenSong),
      ).not.toBe(0);
    });

    it("kaidenAvg/wrScoreがnullの場合のみ、calcが-15を返すこと", () => {
      const nullKaidenSong = { notes: 1000, kaidenAvg: null, wrScore: 1800 };
      const nullWrScoreSong = { notes: 1000, kaidenAvg: 1500, wrScore: null };
      expect(BpiCalculator.calc(900, nullKaidenSong)).toBe(-15);
      expect(BpiCalculator.calc(900, nullWrScoreSong)).toBe(-15);
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

    it("対象楽曲数が0の場合、下限値を返すこと", () => {
      expect(BpiCalculator.calculateTotalBPI([], 0)).toBe(
        BpiCalculator.BPI_FLOOR,
      );
    });

    it("全曲未プレイの場合、下限値になること", () => {
      [1, 10, 92, 470].forEach((n) => {
        expect(BpiCalculator.calculateTotalBPI([], n)).toBe(
          BpiCalculator.BPI_FLOOR,
        );
      });
    });

    it("1曲だけ全一(BPI 100)を持ち他が未プレイの場合、総合BPIが50になること", () => {
      // BPI本来の設計性質。totalBpiExponent はこれを満たすように校正されている
      [2, 10, 92, 470, 980].forEach((n) => {
        expect(BpiCalculator.calculateTotalBPI([100], n)).toBeCloseTo(50, 2);
      });
    });

    it("全曲が同一BPIの場合、総合BPIがその値そのものになること", () => {
      [470, 92, 10].forEach((n) => {
        [-15, 0, 12.5, 50, 100].forEach((v) => {
          expect(
            BpiCalculator.calculateTotalBPI(new Array(n).fill(v), n),
          ).toBeCloseTo(v, 2);
        });
      });
    });

    it("いずれか1曲のBPIを上げたとき、総合BPIが下がらないこと（単調性）", () => {
      const base = [62, 41, 30, 30, 18, 5, 0, -3, -12];
      const n = 40;
      const before = BpiCalculator.calculateTotalBPI([...base], n);
      for (let i = 0; i < base.length; i++) {
        const bumped = [...base];
        bumped[i] += 7;
        bumped.sort((a, b) => b - a);
        expect(BpiCalculator.calculateTotalBPI(bumped, n)).toBeGreaterThanOrEqual(
          before,
        );
      }
    });

    it("1曲をΔ改善しても総合BPIの変化がΔを超えないこと（1-Lipschitz）", () => {
      const profiles = [
        new Array(50).fill(0),
        new Array(50).fill(-8),
        [70, 55, 40, 22, 10, -2, -11],
        new Array(120).fill(35),
      ];
      const deltas = [1, 5, 20];
      profiles.forEach((profile) => {
        [profile.length, 92, 470].forEach((n) => {
          const before = BpiCalculator.calculateTotalBPI([...profile], n);
          deltas.forEach((delta) => {
            for (let i = 0; i < profile.length; i++) {
              const bumped = [...profile];
              bumped[i] += delta;
              bumped.sort((a, b) => b - a);
              const after = BpiCalculator.calculateTotalBPI(bumped, n);
              // 小数第2位への丸めぶんの誤差を許容する
              expect(after - before).toBeLessThanOrEqual(delta + 0.011);
            }
          });
        });
      });
    });

    it("1曲だけを連続的に改善したとき、総合BPIが不連続に飛ばないこと（断崖の回帰テスト）", () => {
      // 修正前は「他50曲が0・1曲が25→30」で総合が -11.24 から +13.66 へ跳んでいた
      const n = 92;
      const rest = new Array(50).fill(0);
      let prev = BpiCalculator.calculateTotalBPI([...rest], n);
      for (let x = -15; x <= 100; x += 1) {
        const total = BpiCalculator.calculateTotalBPI(
          [x, ...rest].sort((a, b) => b - a),
          n,
        );
        expect(total - prev).toBeLessThanOrEqual(1.011);
        prev = total;
      }
    });

    it("未プレイ以外の曲の底上げが総合BPIに反映されること", () => {
      // 修正前は最良1曲に支配され、残り50曲が -8 でも 0 でも +5 でも総合が同じ値になっていた
      const n = 92;
      const withMinus8 = BpiCalculator.calculateTotalBPI(
        new Array(50).fill(-8),
        n,
      );
      const withZero = BpiCalculator.calculateTotalBPI(new Array(50).fill(0), n);
      const withPlus5 = BpiCalculator.calculateTotalBPI(
        new Array(50).fill(5),
        n,
      );
      expect(withZero).toBeGreaterThan(withMinus8);
      expect(withPlus5).toBeGreaterThan(withZero);
    });

    it("下限を下回るBPIが渡されてもNaNにならず、下限扱いになること", () => {
      const n = 10;
      const clamped = BpiCalculator.calculateTotalBPI([-40, -20, 30], n);
      const floored = BpiCalculator.calculateTotalBPI(
        [BpiCalculator.BPI_FLOOR, BpiCalculator.BPI_FLOOR, 30],
        n,
      );
      expect(clamped).not.toBeNaN();
      expect(clamped).toBe(floored);
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
