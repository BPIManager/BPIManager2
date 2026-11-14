import { describe, it, expect } from "vitest";
import { relativeRadarDomain, toRelativeBpi } from "@/lib/radar/relative";

describe("toRelativeBpi", () => {
  it("更新前と同じなら 1.00", () => {
    expect(toRelativeBpi(20, 20)).toBe(1);
    expect(toRelativeBpi(-5, -5)).toBe(1);
  });

  it("床値(-15)を原点にした比で伸びを表す", () => {
    expect(toRelativeBpi(20, 21)).toBeCloseTo(36 / 35, 10);
    expect(toRelativeBpi(0, 15)).toBeCloseTo(2, 10);
  });

  it("下がったときは1未満になる", () => {
    expect(toRelativeBpi(20, 10)).toBeLessThan(1);
  });

  it("更新前が床値付近でも分母を下限で抑える（発散しない）", () => {
    expect(toRelativeBpi(-15, -10)).toBe(5);
    expect(Number.isFinite(toRelativeBpi(-15, 0))).toBe(true);
  });
});

describe("relativeRadarDomain", () => {
  it("1.00 を含み、最大の乖離に余白を持たせた範囲を返す", () => {
    const [lo, hi] = relativeRadarDomain([1, 1.05, 0.98]);
    expect(lo).toBeLessThan(0.98);
    expect(hi).toBeGreaterThan(1.05);
    expect(1).toBeGreaterThan(lo);
    expect(1).toBeLessThan(hi);
  });

  it("全て 1.00 でも幅を持つ", () => {
    const [lo, hi] = relativeRadarDomain([1, 1, 1]);
    expect(hi - lo).toBeGreaterThan(0);
  });
});
