import { describe, it, expect } from "vitest";
import { BpiCalculator } from "@/lib/bpi";

describe("BpiCalculator.ratchetTotalBpi の非有限値ガード", () => {
  it("新しい値がNaNなら既存の最高値を維持すること（NaNを保存しない）", () => {
    expect(BpiCalculator.ratchetTotalBpi(42, Number.NaN)).toBe(42);
  });

  it("新しい値がNaNで記録が無い場合は下限の-15を返すこと", () => {
    expect(BpiCalculator.ratchetTotalBpi(null, Number.NaN)).toBe(-15);
  });

  it("有限の新値は従来どおり既存の最高値とのmaxを返すこと", () => {
    expect(BpiCalculator.ratchetTotalBpi(42, 40)).toBe(42);
    expect(BpiCalculator.ratchetTotalBpi(42, 50)).toBe(50);
  });
});
