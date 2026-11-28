import { describe, expect, it } from "vitest";
import { isSameManualPlay } from "@/lib/scores/sameManualPlay";

// 2026-11-28 23:30 JST（UTC では 14:30）に手動登録した記録
const manual = { batchId: "m-0123456789abcdef-33-20261128-aaaaaa", exScore: 1500, lastPlayed: new Date("2026-11-28T14:30:00Z") };

describe("isSameManualPlay (#711)", () => {
  it("手動登録の記録で、EX と最終プレー日（JST）が同じなら同じプレー", () => {
    expect(isSameManualPlay(manual, { exScore: 1500, lastPlayed: "2026-11-28 09:00" })).toBe(true);
  });

  it("日付は JST で比べる（UTC では前日でも、JST で同じ日なら同じ）", () => {
    const morning = { ...manual, lastPlayed: new Date("2026-11-27T23:30:00Z") }; // JST 11/28 08:30
    expect(isSameManualPlay(morning, { exScore: 1500, lastPlayed: "2026-11-28 22:00" })).toBe(true);
  });

  it("日付・EX が違う、CSV に日付がない、手動登録でない記録は、同じプレーとみなさない", () => {
    expect(isSameManualPlay(manual, { exScore: 1500, lastPlayed: "2026-11-29 09:00" })).toBe(false);
    expect(isSameManualPlay(manual, { exScore: 1501, lastPlayed: "2026-11-28 09:00" })).toBe(false);
    expect(isSameManualPlay(manual, { exScore: 1500, lastPlayed: null })).toBe(false);
    expect(isSameManualPlay({ ...manual, batchId: "3f2a1b4c-uuid" }, { exScore: 1500, lastPlayed: "2026-11-28 09:00" })).toBe(false);
    expect(isSameManualPlay(undefined, { exScore: 1500, lastPlayed: "2026-11-28 09:00" })).toBe(false);
  });
});
