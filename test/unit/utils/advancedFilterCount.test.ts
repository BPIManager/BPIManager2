import { describe, it, expect } from "vitest";
import { countAdvancedFilters } from "@/utils/songs/advancedFilterCount";

describe("countAdvancedFilters", () => {
  it("何も適用していなければ0", () => {
    expect(countAdvancedFilters({})).toBe(0);
    expect(
      countAdvancedFilters({
        clearStates: [],
        versions: [],
        radarCategories: [],
        scoreFilters: [],
      }),
    ).toBe(0);
  });

  it("BPM範囲・ソフラン系はまとめて1件", () => {
    expect(countAdvancedFilters({ bpmMin: 150, bpmMax: 180, excludeSofran: true })).toBe(1);
    expect(countAdvancedFilters({ isSofran: true })).toBe(1);
  });

  it("各セクションを1件ずつ数える", () => {
    expect(
      countAdvancedFilters({
        clearStates: ["HARD CLEAR"],
        since: "thisWeek",
        versions: [33, 34],
        radarCategories: ["SCRATCH"],
        missCountMax: 10,
      }),
    ).toBe(5);
  });

  it("スコア条件は値が入っているものだけを条件ごとに数える", () => {
    expect(
      countAdvancedFilters({
        scoreFilters: [
          { id: "a", metric: "bpi", operator: ">=", value: "10" },
          { id: "b", metric: "djrank", operator: "=", value: "AAA" },
          { id: "c", metric: "scoreRate", operator: ">=", value: "" },
        ],
      }),
    ).toBe(2);
  });
});

describe("countAdvancedFilters プレイ状態", () => {
  it("プレイ状態の項目がある一覧では、既定（プレイ済みのみ）以外を1件として数える", () => {
    const opts = { playState: true };
    expect(countAdvancedFilters({}, opts)).toBe(0);
    expect(countAdvancedFilters({ isMyPlayed: true }, opts)).toBe(0);
    expect(countAdvancedFilters({ isMyPlayed: false }, opts)).toBe(1);
    expect(countAdvancedFilters({ isMyPlayed: null }, opts)).toBe(1);
  });

  it("プレイ状態の項目が無い一覧（比較ページ等）では数えない", () => {
    expect(countAdvancedFilters({ isMyPlayed: false })).toBe(0);
  });
});
