import { describe, expect, it } from "vitest";
import {
  compareMetric,
  movingAverage,
} from "@/utils/logs/getPerformanceComparison";
import type { PerformanceDay } from "@/types/logs/performance";

const day = (over: Partial<PerformanceDay>): PerformanceDay => ({
  date: "2026-09-01",
  songCount: 10,
  firstPlayedAt: 0,
  lastPlayedAt: 0,
  playMinutes: 60,
  sessionBpi: 10,
  keyCount: null,
  scratchCount: null,
  ...over,
});

describe("compareMetric", () => {
  it("直近n日の平均との差と増減率を返す", () => {
    const target = day({ songCount: 30 });
    const past = [day({ songCount: 10 }), day({ songCount: 20 }), day({ songCount: 1000 })];
    const r = compareMetric(target, past, "songCount", 2);
    expect(r.average).toBe(15);
    expect(r.diff).toBe(15);
    expect(r.percent).toBe(100);
  });

  it("値がnullの日は平均から除く", () => {
    const past = [day({ keyCount: null }), day({ keyCount: 100 })];
    const r = compareMetric(day({ keyCount: 150 }), past, "keyCount", 7);
    expect(r.average).toBe(100);
    expect(r.diff).toBe(50);
  });

  it("対象日が未取得または過去日が無ければ差はnull", () => {
    expect(compareMetric(day({ keyCount: null }), [day({ keyCount: 5 })], "keyCount", 7).diff).toBeNull();
    expect(compareMetric(day({}), [], "songCount", 7).average).toBeNull();
  });

  it("平均が0なら増減率はnull", () => {
    const r = compareMetric(day({ keyCount: 5 }), [day({ keyCount: 0 })], "keyCount", 7);
    expect(r.diff).toBe(5);
    expect(r.percent).toBeNull();
  });
});

describe("movingAverage", () => {
  it("窓幅で平均し、nullは除外する", () => {
    expect(movingAverage([10, 20, null, 40], 2)).toEqual([10, 15, 20, 40]);
  });
});
