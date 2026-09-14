import { describe, it, expect } from "vitest";
import { tOf } from "@bpim/bpicalc";
import {
  calculateRadar,
  ALL_CATEGORIES,
  buildRadarSongMaster,
  type RadarSongMaster,
} from "@/lib/radar/calculator";
import { BpiCalculator } from "@/lib/bpi";
import topElements, {
  topElementsByCategory,
} from "@/constants/iidx/radars/topElements";
import type { RadarCategory } from "@/types/stats/radar";
import { NEW_BPI_Z0 } from "@/constants/iidx/newBpi/songParams";

const NOTES = 1000;
const KAIDEN_AVG = 1500;
const WR_SCORE = 1900;
const COEF = 1.175;

/**
 * 指定カテゴリの全楽曲(topElements.json由来)にsongId・mu/sigmaを合成した
 * {@link RadarSongMaster} を組み立てる。全曲同一のnotes/kaidenAvg/wrScoreを
 * 与えるため、単曲BPIの絶対値そのものではなく「未プレイ曲を分母に含めた
 * 時に値が変わるか」という総合BPIの構造だけをテストする。
 */
function buildMasterForCategory(category: RadarCategory): RadarSongMaster {
  const m = NOTES * 2;
  const mu = tOf(KAIDEN_AVG, m) - NEW_BPI_Z0;
  const sigma = 1;
  const entries = (topElementsByCategory.get(category) ?? []).map(
    (e, i) => ({
      songId: i + 1,
      title: e.title,
      difficulty: e.difficulty,
      notes: NOTES,
      kaidenAvg: KAIDEN_AVG,
      wrScore: WR_SCORE,
      coef: COEF,
      mu,
      sigma,
      residualVar: null,
    }),
  );
  return buildRadarSongMaster(entries);
}

const emptyMaster: RadarSongMaster = new Map();

describe("calculateRadar", () => {
  it("スコアが空の場合、全カテゴリのtotalBpiが-15になること", () => {
    const result = calculateRadar([], emptyMaster);
    for (const category of ALL_CATEGORIES) {
      expect(result[category].totalBpi).toBe(-15);
    }
  });

  it("topElementsに存在しないタイトルのスコアはどのカテゴリにも分類されないこと", () => {
    const result = calculateRadar(
      [
        {
          title: "存在しない架空の曲タイトルXYZ",
          difficulty: "ANOTHER",
          exScore: 1800,
          notes: 1000,
          bpi: 30,
        },
      ],
      emptyMaster,
    );

    for (const category of ALL_CATEGORIES) {
      const played = result[category].songs.filter((s) => s.exScore !== null);
      expect(played).toHaveLength(0);
      expect(result[category].totalBpi).toBe(-15);
    }
  });

  it("topElementsに実在する楽曲のスコアは対応するカテゴリに分類されtotalBpiが計算されること", () => {
    const sample = topElements[0];
    const master = buildMasterForCategory(sample.top as RadarCategory);
    const result = calculateRadar(
      [
        {
          title: sample.title,
          difficulty: sample.difficulty,
          exScore: 1800,
          notes: 1000,
          bpi: 40,
        },
      ],
      master,
    );

    const category = result[sample.top as RadarCategory];
    const playedEntry = category.songs.find(
      (s) => s.title === sample.title && s.difficulty === sample.difficulty,
    );
    expect(playedEntry).toBeDefined();
    expect(playedEntry?.bpi).toBe(40);
    expect(category.totalBpi).not.toBe(-15);
  });

  it("bpiがnullのスコアは-15として扱われること", () => {
    const sample = topElements[0];
    const result = calculateRadar(
      [
        {
          title: sample.title,
          difficulty: sample.difficulty,
          exScore: 1800,
          notes: 1000,
          bpi: null,
        },
      ],
      emptyMaster,
    );
    const entry = result[sample.top as RadarCategory].songs.find(
      (s) => s.title === sample.title && s.difficulty === sample.difficulty,
    );
    expect(entry?.bpi).toBe(-15);
  });

  it("songsはbpi降順でソートされること", () => {
    const result = calculateRadar([], emptyMaster);
    for (const category of ALL_CATEGORIES) {
      const bpis = result[category].songs.map((s) => s.bpi);
      const sorted = [...bpis].sort((a, b) => b - a);
      expect(bpis).toEqual(sorted);
    }
  });

  it("totalBpiの計算が未プレイ曲を分母に含むこと（未プレイ曲の減点が反映される）", () => {
    const sample = topElements[0];
    const category0 = sample.top as RadarCategory;
    const master = buildMasterForCategory(category0);
    const result = calculateRadar(
      [
        {
          title: sample.title,
          difficulty: sample.difficulty,
          exScore: 1800,
          notes: 1000,
          bpi: 40,
        },
      ],
      master,
    );

    const category = result[category0];
    const unplayedCount = category.songs.filter(
      (s) => s.exScore === null,
    ).length;
    expect(unplayedCount).toBeGreaterThan(0);

    const sampleMaster = master.get(`${sample.title}___${sample.difficulty}`)!;
    const observations = [
      { songId: sampleMaster.songId, notes: sampleMaster.notes, exScore: 1800 },
    ];
    const categoryMaster = Array.from(master.values());
    const expectedTotalBpi = BpiCalculator.calculateTotalBPI(
      observations,
      categoryMaster,
    );
    expect(category.totalBpi).toBe(expectedTotalBpi);

    // プレイ済み曲のみを対象にした場合の値とは異なる（未プレイ曲の予測が
    // 効いていることの確認、バグ再発防止）
    const playedOnlyTotalBpi = BpiCalculator.calculateTotalBPI(observations, [
      sampleMaster,
    ]);
    expect(category.totalBpi).not.toBe(playedOnlyTotalBpi);
  });

  it("validSongKeysを指定すると、未プレイ曲のうち含まれないものが除外されること", () => {
    const withoutFilter = calculateRadar([], emptyMaster);
    const withEmptyFilter = calculateRadar([], emptyMaster, new Set());

    const category = ALL_CATEGORIES.find(
      (c) => withoutFilter[c].songs.length > 0,
    )!;
    expect(withEmptyFilter[category].songs).toHaveLength(0);
    expect(withoutFilter[category].songs.length).toBeGreaterThan(0);
  });
});
