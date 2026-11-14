import { describe, it, expect } from "vitest";
import {
  bpiListQuery,
  rankListQuery,
  scoreRateListQuery,
} from "@/utils/dashboard/scoreListLink";
import { filterSongsFrontend } from "@/utils/songs/filter";
import type { FilterParamsFrontend, SongWithScore } from "@/types/songs/score";

const song = (exScore: number | null, bpi: number | null, notes = 1000) =>
  ({
    songId: 1,
    title: "t",
    difficulty: "ANOTHER",
    difficultyLevel: 12,
    bpm: "150",
    releasedVersion: 30,
    notes,
    exScore,
    bpi,
    clearState: null,
  }) as unknown as SongWithScore;

const toParams = (q: Record<string, string>): FilterParamsFrontend => ({
  scoreFilters: q.scoreFilters ? JSON.parse(q.scoreFilters) : undefined,
});

const matches = (s: SongWithScore, q: Record<string, string>) =>
  filterSongsFrontend([s], toParams(q)).length === 1;

describe("rankListQuery", () => {
  it("指定ランクの譜面だけに一致する", () => {
    // notes=1000 → 理論値2000。AAAは8/9=1777.8以上、MAX-は17/18=1888.9以上
    const q = rankListQuery("AAA");
    expect(matches(song(1800, 0), q)).toBe(true);
    expect(matches(song(1700, 0), q)).toBe(false);
    expect(matches(song(1900, 0), q)).toBe(false);
  });

  it("最上位・最下位ランクも一致する", () => {
    expect(matches(song(1950, 0), rankListQuery("MAX-"))).toBe(true);
    expect(matches(song(10, 0), rankListQuery("F"))).toBe(true);
  });
});

describe("scoreRateListQuery", () => {
  it("区間の下端以上・上端未満に一致し、上端ちょうどは次の区間になる", () => {
    const q = scoreRateListQuery("90", 5);
    expect(matches(song(1800, 0), q)).toBe(true); // 90%
    expect(matches(song(1900, 0), q)).toBe(false); // 95%は次の区間
    expect(matches(song(1750, 0), q)).toBe(false);
  });

  it("100は理論値のみ", () => {
    const q = scoreRateListQuery("100", 5);
    expect(matches(song(2000, 0), q)).toBe(true);
    expect(matches(song(1990, 0), q)).toBe(false);
  });
});

describe("bpiListQuery", () => {
  it("区間の下端以上・上端未満に一致する", () => {
    const q = bpiListQuery("0", 10);
    expect(matches(song(1000, 0), q)).toBe(true);
    expect(matches(song(1000, 9.99), q)).toBe(true);
    expect(matches(song(1000, 10), q)).toBe(false);
    expect(matches(song(1000, -0.01), q)).toBe(false);
  });

  it("<-10 と 100+ の両端", () => {
    expect(matches(song(1000, -12), bpiListQuery("<-10", 10))).toBe(true);
    expect(matches(song(1000, -10), bpiListQuery("<-10", 10))).toBe(false);
    expect(matches(song(1000, 100), bpiListQuery("100+", 10))).toBe(true);
    expect(matches(song(1000, 99.9), bpiListQuery("100+", 10))).toBe(false);
  });

  it("未プレイ（EXスコアなし）の譜面は含めない", () => {
    expect(matches(song(null, null), bpiListQuery("<-10", 10))).toBe(false);
  });
});

describe("スコア条件のBPI", () => {
  const bpiCond = (operator: ">=" | "<=" | "=", value: string) => ({
    scoreFilters: [{ id: "x", metric: "bpi" as const, operator, value }],
  });

  it("以上・以下・に等しいで判定する", () => {
    expect(filterSongsFrontend([song(1000, 5)], bpiCond(">=", "5"))).toHaveLength(1);
    expect(filterSongsFrontend([song(1000, 4.99)], bpiCond(">=", "5"))).toHaveLength(0);
    expect(filterSongsFrontend([song(1000, 5)], bpiCond("<=", "5"))).toHaveLength(1);
    expect(filterSongsFrontend([song(1000, 5.01)], bpiCond("<=", "5"))).toHaveLength(0);
    expect(filterSongsFrontend([song(1000, 5.001)], bpiCond("=", "5"))).toHaveLength(1);
    expect(filterSongsFrontend([song(1000, 5.01)], bpiCond("=", "5"))).toHaveLength(0);
  });
});

describe("スコア条件の「に等しい」", () => {
  const cond = (metric: "scoreRate" | "djrank", value: string) =>
    ({ scoreFilters: [{ id: "x", metric, operator: "=" as const, value }] }) satisfies FilterParamsFrontend;

  it("スコアレートは小数第2位までの一致で判定する", () => {
    expect(filterSongsFrontend([song(1800, 0)], cond("scoreRate", "90"))).toHaveLength(1);
    expect(filterSongsFrontend([song(1801, 0)], cond("scoreRate", "90"))).toHaveLength(0);
  });

  it("DJRANKは同ランクのみ一致する", () => {
    expect(filterSongsFrontend([song(1800, 0)], cond("djrank", "AAA"))).toHaveLength(1);
    expect(filterSongsFrontend([song(1900, 0)], cond("djrank", "AAA"))).toHaveLength(0);
  });
});

describe("bpmBandListQuery / radarCategoryListQuery", () => {
  const withBpm = (bpm: string | null, radarTop: string | null = null) =>
    ({ ...(song(1800, 0) as object), bpm, radarTop }) as unknown as SongWithScore;
  const toParams2 = (q: Record<string, string>): FilterParamsFrontend => ({
    bpmMin: q.bpmMin ? Number(q.bpmMin) : undefined,
    bpmMax: q.bpmMax ? Number(q.bpmMax) : undefined,
    isSofran: q.isSofran === "true",
    excludeSofran: q.excludeSofran === "true",
    radarCategories: q.radarCategories ? q.radarCategories.split(",") : undefined,
  });
  const match = (s: SongWithScore, q: Record<string, string>) =>
    filterSongsFrontend([s], toParams2(q)).length === 1;

  it("数値の帯は、帯の範囲内の固定BPM曲だけに一致し、ソフラン曲は含めない", async () => {
    const { bpmBandListQuery } = await import("@/utils/dashboard/scoreListLink");
    const q = bpmBandListQuery("160~180");
    expect(match(withBpm("160"), q)).toBe(true);
    expect(match(withBpm("179"), q)).toBe(true);
    expect(match(withBpm("180"), q)).toBe(false);
    expect(match(withBpm("159"), q)).toBe(false);
    expect(match(withBpm("100-170"), q)).toBe(false);
  });

  it("両端の帯（200~ と ~120）", async () => {
    const { bpmBandListQuery } = await import("@/utils/dashboard/scoreListLink");
    expect(match(withBpm("200"), bpmBandListQuery("200~"))).toBe(true);
    expect(match(withBpm("199"), bpmBandListQuery("200~"))).toBe(false);
    expect(match(withBpm("119"), bpmBandListQuery("~120"))).toBe(true);
    expect(match(withBpm("120"), bpmBandListQuery("~120"))).toBe(false);
  });

  it("Soflan の帯はソフラン曲だけに一致する", async () => {
    const { bpmBandListQuery } = await import("@/utils/dashboard/scoreListLink");
    const q = bpmBandListQuery("Soflan");
    expect(match(withBpm("100-170"), q)).toBe(true);
    expect(match(withBpm("150"), q)).toBe(false);
  });

  it("レーダーカテゴリはそのカテゴリの曲だけに一致する", async () => {
    const { radarCategoryListQuery } = await import("@/utils/dashboard/scoreListLink");
    const q = radarCategoryListQuery("SCRATCH");
    expect(match(withBpm("150", "SCRATCH"), q)).toBe(true);
    expect(match(withBpm("150", "NOTES"), q)).toBe(false);
    expect(match(withBpm("150", null), q)).toBe(false);
  });
});
