import { describe, it, expect } from "vitest";
import { findOptimalBpiPath } from "@/lib/bpi/optimizer";
import { diversityMultiplier } from "@/lib/bpi/optimizer/candidateScorer";
import { BpiCalculator } from "@/lib/bpi";
import type { ExecuteOptions, SongOptimizerInput } from "@/types/bpi-optimizer";

/**
 * 実際のBPI(V2)本番定数(`@/constants/iidx/newBpi/modelConstants`)に対して
 * 現実的なBPIカーブを描くよう校正したフィクスチャ用のmu/sigma
 * （scripts/generate-new-bpi-params.tsの生成物ではなく、テスト用に手動算出した値）。
 * notes=1000, kaidenAvg=1750, wrScore=1980のときkaidenAvg付近でBPI≈0、
 * wrScore付近でBPI≈100になるよう校正している。
 */
const FIXTURE_MU = -5.521460917862246;
const FIXTURE_SIGMA = 0.3157160805385319;

function makeSong(overrides: Partial<SongOptimizerInput> = {}): SongOptimizerInput {
  const notes = 1000;
  const kaidenAvg = 1750;
  const wrScore = 1980;
  const coef = 1;
  const mu = FIXTURE_MU;
  const sigma = FIXTURE_SIGMA;
  const currentExScore = overrides.currentExScore ?? null;

  return {
    songId: 1,
    title: "テスト曲",
    difficulty: "ANOTHER",
    difficultyLevel: 12,
    notes,
    kaidenAvg,
    wrScore,
    coef,
    mu,
    sigma,
    residualVar: null,
    currentBpi:
      currentExScore != null
        ? (BpiCalculator.calc(currentExScore, { notes, kaidenAvg, wrScore, coef, mu, sigma }) ?? -15)
        : -15,
    currentExScore,
    isUnplayed: currentExScore == null,
    radarCategory: null,
    ...overrides,
  };
}

/**
 * 総合BPIのシフト法べき乗平均は対象曲数n=1だと再校正指数k'=ln(1)/ln(...)=0となり
 * 定義上NaNになる（本番では常にn≈648なので起きない、n=1特有の退化ケース）。
 * テストではnを2以上に保つため、計算に影響しないフィラー曲（mu/sigma無し＝V2の
 * スコープ外、候補にも潜在スキル推定にもならない）を添える。
 */
function makeFillerSong(songId: number): SongOptimizerInput {
  return {
    songId,
    title: "フィラー曲",
    difficulty: "ANOTHER",
    difficultyLevel: 12,
    notes: 1000,
    kaidenAvg: null,
    wrScore: null,
    coef: null,
    mu: null,
    sigma: null,
    residualVar: null,
    currentBpi: -15,
    currentExScore: null,
    isUnplayed: true,
    radarCategory: null,
  };
}

const baseOptions: ExecuteOptions = {
  includeUnplayed: true,
  includePlayed: true,
  radarElementFilter: null,
  candidateLevels: [],
  candidateDifficulties: [],
  searchMode: "fastest",
  rng: () => 0.5,
};

describe("findOptimalBpiPath", () => {
  it("対象楽曲数が0の場合、達成不可・ステップなしの結果を返すこと", () => {
    const result = findOptimalBpiPath([], 20, baseOptions);

    expect(result.totalSongCount).toBe(0);
    expect(result.steps).toEqual([]);
    expect(result.achievable).toBe(false);
    expect(result.alreadyAchieved).toBe(false);
  });

  it("既に現在の総合BPIが目標を上回っている場合、alreadyAchievedになりステップは生成されないこと", () => {
    const song = makeSong({ currentExScore: 1950 });
    const result = findOptimalBpiPath([song, makeFillerSong(99)], -10, baseOptions);

    expect(result.alreadyAchieved).toBe(true);
    expect(result.achievable).toBe(true);
    expect(result.steps).toEqual([]);
  });

  it("到達可能な目標に対して、BPIが向上するステップを生成すること", () => {
    const song = makeSong({ currentExScore: null });
    const result = findOptimalBpiPath([song, makeFillerSong(99)], -5, baseOptions);

    expect(result.steps.length).toBeGreaterThan(0);
    const lastStep = result.steps[result.steps.length - 1];
    expect(lastStep.cumulativeTotalBpi).toBeGreaterThan(result.currentTotalBpi);
    expect(lastStep.toExScore).toBeGreaterThan(0);
    expect(lastStep.toExScore).toBeLessThanOrEqual(song.notes * 2);
  });

  it("currentTotalBpiは、同じ観測をBpiCalculator.calculateTotalBPIに直接渡した場合と一致すること（アプリ他画面との整合性）", () => {
    const song = makeSong({ currentExScore: 1850, songId: 1 });
    const song2 = makeSong({ currentExScore: null, songId: 2 });
    const result = findOptimalBpiPath([song, song2], -5, baseOptions);

    const expected = BpiCalculator.calculateTotalBPI(
      [{ songId: 1, notes: song.notes, exScore: 1850 }],
      [song, song2],
    );
    expect(result.currentTotalBpi).toBeCloseTo(expected, 2);
  });

  it("各ステップのtoBpiは、提案されたtoExScoreを実際にプレイした場合にV2モデルが返す単曲BPIと一致すること", () => {
    const song = makeSong({ currentExScore: null });
    const result = findOptimalBpiPath([song, makeFillerSong(99)], -5, baseOptions);

    for (const step of result.steps) {
      const actual = BpiCalculator.calc(step.toExScore, song);
      expect(step.toBpi).toBeCloseTo(actual ?? -15, 2);
    }
  });

  it("includeUnplayedがfalseで候補が未プレイ曲のみの場合、候補なしとなり進展しないこと", () => {
    const song = makeSong({ currentExScore: null });
    const result = findOptimalBpiPath(
      [song],
      20,
      { ...baseOptions, includeUnplayed: false },
      5,
    );

    expect(result.steps).toEqual([]);
    expect(result.achievable).toBe(false);
    expect(result.alreadyAchieved).toBe(false);
  });

  it("candidateLevelsで対象レベルを絞り込めること", () => {
    const song = makeSong({ currentExScore: null, difficultyLevel: 12 });
    const result = findOptimalBpiPath(
      [song],
      20,
      { ...baseOptions, candidateLevels: [11] },
      5,
    );

    expect(result.steps).toEqual([]);
  });

  it("searchMode: flexibleでも到達可能な目標に対してBPIが向上するステップを生成すること", () => {
    const songs = [1, 2, 3].map((songId) => makeSong({ songId, currentExScore: null }));
    const result = findOptimalBpiPath(songs, -5, { ...baseOptions, searchMode: "flexible" });

    expect(result.steps.length).toBeGreaterThan(0);
    const lastStep = result.steps[result.steps.length - 1];
    expect(lastStep.cumulativeTotalBpi).toBeGreaterThan(result.currentTotalBpi);
  });

  it("到達不可能な目標に対しても、最も到達点が高い結果を返すこと", () => {
    const song = makeSong({ currentExScore: null });
    const result = findOptimalBpiPath(
      [song, makeFillerSong(99)],
      100,
      { ...baseOptions, maxRetries: 3 },
      3,
    );

    expect(result.alreadyAchieved).toBe(false);
    expect(result.achievable).toBe(false);
    expect(result.maxAchievableBpi).toBeDefined();
    expect(result.maxAchievableBpi!).toBeGreaterThan(result.currentTotalBpi);
  });

  it("considerCurrentTotalBpi=falseの場合、目標値まで見込んだ高い目標BPIで曲を狙うため、trueの場合よりtoExScoreが大きくなること", () => {
    const song = makeSong({ currentExScore: null });
    const withCurrent = findOptimalBpiPath([song, makeFillerSong(99)], 40, {
      ...baseOptions,
      considerCurrentTotalBpi: true,
      maxRetries: 1,
    }, 1);
    const withoutCurrent = findOptimalBpiPath([{ ...song }, makeFillerSong(99)], 40, {
      ...baseOptions,
      considerCurrentTotalBpi: false,
      maxRetries: 1,
    }, 1);

    expect(withoutCurrent.steps[0].toExScore).toBeGreaterThanOrEqual(
      withCurrent.steps[0].toExScore,
    );
  });

  it("ColdStartGuard: レーダーカテゴリのプレイ実績が薄い場合、そのカテゴリの未プレイ曲は候補から除外され、coldCategoriesに案内が含まれること", () => {
    const playedElsewhere = makeSong({
      songId: 1,
      currentExScore: 1850,
      radarCategory: "CHORD",
    });
    const coldCategorySong = makeSong({
      songId: 2,
      currentExScore: null,
      radarCategory: "NOTES",
    });
    const result = findOptimalBpiPath(
      [playedElsewhere, coldCategorySong],
      50,
      { ...baseOptions, radarElementFilter: ["NOTES"] },
      5,
    );

    expect(result.coldCategories).toBeDefined();
    expect(result.coldCategories!.some((c) => c.category === "NOTES")).toBe(true);
    expect(result.steps.find((s) => s.songId === 2)).toBeUndefined();
  });

  it("ColdStartGuard: 案内対象のカテゴリでも、プレイ済み曲の上振れ狙い（includePlayed）は継続して提案されること", () => {
    const playedInColdCategory = makeSong({
      songId: 1,
      currentExScore: 1600,
      radarCategory: "NOTES",
      // 精度重みsigma^2/ev_jが小さくなるよう分散を大きく設定し、
      // 1曲プレイしただけではinfo_cの信頼度閾値に届かない(コールドなまま)ようにする
      residualVar: 100,
    });
    const result = findOptimalBpiPath(
      [playedInColdCategory, makeFillerSong(99)],
      -5,
      { ...baseOptions, includeUnplayed: false, includePlayed: true, radarElementFilter: ["NOTES"] },
      5,
    );

    expect(result.coldCategories?.some((c) => c.category === "NOTES")).toBe(true);
    expect(result.steps.length).toBeGreaterThan(0);
  });

  describe("diversityMultiplier（既に得意な曲ばかりが選ばれ続ける偏りへの対策）", () => {
    it("未プレイ曲は倍率が上乗せされること", () => {
      const unplayed = makeSong({ currentExScore: null });
      const played = makeSong({ currentExScore: 1900 });

      expect(diversityMultiplier(unplayed, -15, 30)).toBeGreaterThan(
        diversityMultiplier(played, 40, 30),
      );
    });

    it("現在の総合BPIをまだ下回っている曲は倍率が上乗せされること", () => {
      const song = makeSong({ currentExScore: 1900 });
      const belowTotal = diversityMultiplier(song, 20, 30);
      const aboveTotal = diversityMultiplier(song, 40, 30);

      expect(belowTotal).toBeGreaterThan(aboveTotal);
    });

    it("未プレイかつ総合BPI未満の場合、両方のボーナスが重なること", () => {
      const song = makeSong({ currentExScore: null });
      expect(diversityMultiplier(song, -15, 30)).toBeCloseTo(2.0, 5);
    });
  });

  it("fastestは既に高BPIな曲を、flexibleは伸びしろのある曲を優先すること（同じ候補集合で比較）", () => {
    // 同じ譜面形状で、現在のスコアだけが違う2曲。eliteは既に全一級（EX伸びしろがわずか
    // だが総合BPIへの寄与は大きい）、averageはまだ皆伝平均寄り（EX伸びしろは大きいが
    // 総合BPIへの直接寄与は小さい）。
    const elite = makeSong({ songId: 1, title: "elite", currentExScore: 1960 });
    const average = makeSong({ songId: 2, title: "average", currentExScore: 1800 });
    const options: ExecuteOptions = {
      ...baseOptions,
      includeUnplayed: false,
      includePlayed: true,
      maxRetries: 1,
    };

    const fastest = findOptimalBpiPath(
      [elite, average, makeFillerSong(99)],
      42,
      { ...options, searchMode: "fastest" },
      1,
    );
    const flexible = findOptimalBpiPath(
      [elite, average, makeFillerSong(99)],
      42,
      { ...options, searchMode: "flexible" },
      1,
    );

    expect(fastest.steps[0]?.title).toBe("elite");
    expect(flexible.steps[0]?.title).toBe("average");
  });
});
