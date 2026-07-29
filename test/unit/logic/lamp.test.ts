import { describe, it, expect } from "vitest";
import { isImproved, LAMP_RANK } from "@/lib/lamp";

describe("isImproved", () => {
  it("上位ランプへの更新はtrueを返すこと", () => {
    expect(isImproved("HARD CLEAR", "CLEAR")).toBe(true);
  });

  it("下位ランプへの変化はfalseを返すこと", () => {
    expect(isImproved("CLEAR", "HARD CLEAR")).toBe(false);
  });

  it("同一ランプはfalseを返すこと", () => {
    expect(isImproved("CLEAR", "CLEAR")).toBe(false);
  });

  it("旧ランプがnull(未プレイ)の場合、FAILEDでもtrueを返すこと", () => {
    expect(isImproved("FAILED", null)).toBe(true);
  });

  it("最上位ランプ同士の比較でfalseを返すこと", () => {
    expect(isImproved("FULLCOMBO CLEAR", "FULLCOMBO CLEAR")).toBe(false);
  });

  it("未知のランプ文字列はNO PLAY相当(0)として扱われること", () => {
    expect(isImproved("UNKNOWN_LAMP", null)).toBe(false);
    expect(isImproved("CLEAR", "UNKNOWN_LAMP")).toBe(true);
  });

  it("全ランプ組み合わせでLAMP_RANKの大小関係と一致すること", () => {
    const labels = Object.keys(LAMP_RANK);
    for (const a of labels) {
      for (const b of labels) {
        expect(isImproved(a, b)).toBe(LAMP_RANK[a] > LAMP_RANK[b]);
      }
    }
  });
});
