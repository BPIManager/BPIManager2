import { describe, it, expect } from "vitest";
import { NewBpiCalculator } from "@/lib/bpi/newBpi";
import {
  newBpiSongParamMap,
  NEW_BPI_ARENA_POPULATION_SIZE,
  NEW_BPI_Z0,
} from "@/constants/iidx/newBpi/songParams";

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
      expect(Math.abs(backToScore - 2700)).toBeLessThan(4);
    });
  });

  describe("総合BPI(issue #304: プレイ済み曲は単曲BPIそのまま・未プレイ曲はa_i予測で埋める)", () => {
    it("観測・楽曲情報が無ければnullを返す", () => {
      expect(NewBpiCalculator.estimateLatentSkill([])).toBeNull();
      expect(NewBpiCalculator.calculateTotalBPI([], [])).toBeNull();
    });

    it("パラメータ未収録の楽曲しか無ければnullを返す", () => {
      expect(
        NewBpiCalculator.estimateLatentSkill([
          { songId: -1, notes: NOTES, exScore: 2500 },
        ]),
      ).toBeNull();
    });

    it("同じ実力でも観測曲数が少ないほど0(母集団平均)側へ縮む", () => {
      const songIds = [...newBpiSongParamMap.keys()].slice(0, 30);
      // 全曲について「そこそこ上手い」スコアを与え、素の重み付き最小二乗解が
      // 曲数によらずほぼ同じ水準になるようにする(全曲同一スコアレートで代用)。
      const scoreOf = (songId: number) => {
        const param = newBpiSongParamMap.get(songId)!;
        // t = mu + sigma * a を a=1.5 相当のスコアに逆算
        const t = param.mu + param.sigma * 1.5;
        const miss = Math.exp(-t);
        return Math.max(0, NOTES * 2 - miss);
      };

      const fewObservations = songIds.slice(0, 3).map((songId) => ({
        songId,
        notes: NOTES,
        exScore: scoreOf(songId),
      }));
      const manyObservations = songIds.map((songId) => ({
        songId,
        notes: NOTES,
        exScore: scoreOf(songId),
      }));

      const aFew = NewBpiCalculator.estimateLatentSkill(fewObservations)!;
      const aMany = NewBpiCalculator.estimateLatentSkill(manyObservations)!;
      expect(aFew).not.toBeNull();
      expect(aMany).not.toBeNull();
      // 縮小推定なので、観測が少ないほど真値(≈1.5)から0側へ寄る
      expect(Math.abs(aFew)).toBeLessThan(Math.abs(aMany));
      expect(aFew).toBeGreaterThan(0);
      expect(aMany).toBeGreaterThan(aFew);
    });

    it("全曲プレイ済みなら、シフト法(issue #297)によるべき乗平均に一致する(未プレイ埋めが介在しない)", () => {
      const songIds = [...newBpiSongParamMap.keys()].slice(0, 20);
      const allSongs = songIds.map((songId) => ({
        songId,
        notes: NOTES,
        kaidenAvg: KAIDEN_AVG,
        wrScore: WR_SCORE,
      }));
      const observations = allSongs.map((s) => ({
        songId: s.songId,
        notes: s.notes,
        exScore: 2700,
      }));

      const measured = allSongs
        .map((s) => NewBpiCalculator.calc(2700, s)!)
        .sort((a, b) => b - a);
      // シフト法(c=15, k'=ln(n)/ln((100+c)/(50+c)))を素朴に再実装して照合する
      const n = allSongs.length;
      const c = 15;
      const kPrime = Math.log(n) / Math.log((100 + c) / (50 + c));
      const sum = measured.reduce((acc, bpi) => acc + Math.pow(bpi + c, kPrime) / n, 0);
      const expected = Math.round((Math.pow(sum, 1 / kPrime) - c) * 100) / 100;

      const total = NewBpiCalculator.calculateTotalBPI(observations, allSongs);
      expect(total).toBeCloseTo(expected, 1);
    });

    it("未プレイ曲を含む場合、下限(-15)に張り付かず埋められる（皆伝平均程度のスコアなら）", () => {
      const songIds = [...newBpiSongParamMap.keys()].slice(0, 50);
      const allSongs = songIds.map((songId) => ({
        songId,
        notes: NOTES,
        kaidenAvg: KAIDEN_AVG,
        wrScore: WR_SCORE,
      }));
      // 5曲だけプレイ、残り45曲は未プレイ
      const observations = allSongs.slice(0, 5).map((s) => ({
        songId: s.songId,
        notes: s.notes,
        exScore: KAIDEN_AVG,
      }));

      const total = NewBpiCalculator.calculateTotalBPI(observations, allSongs);
      expect(total).not.toBeNull();
      expect(total!).toBeGreaterThan(-15);
    });

    it("1曲だけ全一・残りが未プレイの場合、未プレイ曲の予測が信頼度重みで抑制される", () => {
      // 上位勢のような「多くの曲を高いレベルでプレイしている」ケースで総合BPIが
      // 直感に反して下がる問題(現行方式の性質: 得意曲に支配されるべき乗平均)を
      // 避けるため、未プレイ曲をa_iからの予測で埋める設計にした。予測を
      // そのまま信頼すると、1曲だけの観測でも全曲に対して強気な予測をして
      // しまう(この曲だけで総合BPIが約85まで跳ね上がることを確認済み)。
      // 信頼度重み(w = den/(den+residualVariance)、事後分散の残り具合の
      // 補数)により、この暴走が抑制されることを確認する。
      //
      // なお、この値は現行方式の「1曲全一+残り未プレイ→総合50」という
      // 性質には一致しない(50は旧尺度のk=log2(n)という指数の選び方に由来する
      // 目印であり、分布ベースの新モデルが再現すべき統計的な必然性はないため、
      // 意図してこの乖離を許容している。docs/bpi-new-formula-deviation-audit.md
      // 参照)。ここでは「無補正(約85)よりは抑制され、かつ無限に膨らまない
      // 常識的な範囲に収まる」ことだけを確認する。
      const songIds = [...newBpiSongParamMap.keys()].slice(0, 100);
      const allSongs = songIds.map((songId) => ({
        songId,
        notes: NOTES,
        kaidenAvg: KAIDEN_AVG,
        wrScore: WR_SCORE,
      }));
      const observations = [
        { songId: allSongs[0].songId, notes: NOTES, exScore: WR_SCORE },
      ];

      const total = NewBpiCalculator.calculateTotalBPI(observations, allSongs);
      expect(total).not.toBeNull();
      expect(total!).toBeGreaterThan(40);
      expect(total!).toBeLessThan(80);
    });

    it("プレイ曲数が多いほど、未プレイ曲の予測をより強く信頼する(betterな推定に漸近する)", () => {
      const songIds = [...newBpiSongParamMap.keys()].slice(0, 100);
      const allSongs = songIds.map((songId) => ({
        songId,
        notes: NOTES,
        kaidenAvg: KAIDEN_AVG,
        wrScore: WR_SCORE,
      }));
      const scoreOf = (songId: number) => {
        const param = newBpiSongParamMap.get(songId)!;
        const t = param.mu + param.sigma * 2;
        const miss = Math.exp(-t);
        return Math.max(0, NOTES * 2 - miss);
      };

      const fewPlayed = allSongs.slice(0, 3).map((s) => ({
        songId: s.songId,
        notes: s.notes,
        exScore: scoreOf(s.songId),
      }));
      const manyPlayed = allSongs.slice(0, 80).map((s) => ({
        songId: s.songId,
        notes: s.notes,
        exScore: scoreOf(s.songId),
      }));

      const totalFew = NewBpiCalculator.calculateTotalBPI(fewPlayed, allSongs)!;
      const totalMany = NewBpiCalculator.calculateTotalBPI(manyPlayed, allSongs)!;
      // どちらも同じ実力(a=2相当)のスコアだが、観測が少ないfewPlayed側は
      // 未プレイ曲の埋めが-15寄りになる分、totalManyより低くなるはず
      expect(totalFew).toBeLessThan(totalMany);
    });
  });

  describe("順位推定(estimateRank: 実測アリーナ順位カーブに基づく経験的推定)", () => {
    it("潜在能力が高いほど推定順位は良くなる(単調性)", () => {
      const rankLow = NewBpiCalculator.estimateRank(-1);
      const rankMid = NewBpiCalculator.estimateRank(0);
      const rankHigh = NewBpiCalculator.estimateRank(2);
      expect(rankHigh).toBeLessThan(rankMid);
      expect(rankMid).toBeLessThan(rankLow);
    });

    it("順位は1からアリーナA帯在籍者数の範囲に収まる", () => {
      expect(NewBpiCalculator.estimateRank(100)).toBe(1);
      expect(NewBpiCalculator.estimateRank(-100)).toBe(NEW_BPI_ARENA_POPULATION_SIZE);
      const midRank = NewBpiCalculator.estimateRank(0);
      expect(midRank).toBeGreaterThanOrEqual(1);
      expect(midRank).toBeLessThanOrEqual(NEW_BPI_ARENA_POPULATION_SIZE);
    });

    it("z0(BPI=0のアンカー)相当の潜在能力では、アリーナA帯のおおむね中央付近の順位になる", () => {
      // z0はアリーナA帯在籍者のa_iの中央値として定義されている(決定記録0007)ため、
      // a=z0での推定順位はアリーナA帯人数のおおむね半分に近いはず
      const rank = NewBpiCalculator.estimateRank(NEW_BPI_Z0);
      expect(rank).toBeGreaterThan(NEW_BPI_ARENA_POPULATION_SIZE * 0.3);
      expect(rank).toBeLessThan(NEW_BPI_ARENA_POPULATION_SIZE * 0.7);
    });
  });
});
