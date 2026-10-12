import { describe, expect, it } from "vitest";
import { scoresBulkBodySchema } from "@/schemas/scores/bulk";
import { profileUpsertSchema } from "@/schemas/profile/upsert";
import { createOptimizeMemoBodySchema } from "@/schemas/optimizeMemo/create";
import { timelineQuerySchema } from "@/schemas/timeline/query";

const row = (over: Record<string, unknown> = {}) => ({
  title: "T",
  difficulty: "ANOTHER",
  exScore: 1800,
  clearState: "HARD CLEAR",
  missCount: 3,
  lastPlayed: null,
  ...over,
});

describe("scoresBulkBodySchema", () => {
  it("定義済みのクリア状態・難易度の行を受け付ける", () => {
    expect(scoresBulkBodySchema.safeParse({ version: "33", csvRows: [row()] }).success).toBe(true);
    expect(
      scoresBulkBodySchema.safeParse({ version: "33", csvRows: [row({ difficulty: "NORMAL", clearState: "FULLCOMBO CLEAR" })] }).success,
    ).toBe(true);
  });

  it("未知のクリア状態・難易度、負数・小数のmissCountは弾く", () => {
    for (const bad of [{ clearState: "WHATEVER" }, { difficulty: "EXPERT" }, { missCount: -1 }, { missCount: 1.5 }]) {
      expect(scoresBulkBodySchema.safeParse({ version: "33", csvRows: [row(bad)] }).success).toBe(false);
    }
  });
});

describe("profileUpsertSchema.iidxId", () => {
  const base = { userName: "tester", isPublic: 1 };

  it("8桁（ハイフン有無）・空文字・nullを受け付ける", () => {
    for (const v of ["08319886", "0831-9886", "", null]) {
      expect(profileUpsertSchema.safeParse({ ...base, iidxId: v }).success, String(v)).toBe(true);
    }
  });

  it("桁数・文字種が不正なら弾く", () => {
    for (const v of ["1234567", "abcd-efgh", "0831-98866"]) {
      expect(profileUpsertSchema.safeParse({ ...base, iidxId: v }).success, v).toBe(false);
    }
  });
});

describe("createOptimizeMemoBodySchema.targetBpi", () => {
  it("UIの入力範囲(-15〜100)外は弾く", () => {
    const parse = (targetBpi: number) =>
      createOptimizeMemoBodySchema.safeParse({ targetBpi, reportData: {} }).error?.issues.some((i) => i.path[0] === "targetBpi");
    expect(parse(50)).toBeFalsy();
    expect(parse(101)).toBe(true);
    expect(parse(-16)).toBe(true);
  });
});

describe("timelineQuerySchema", () => {
  it("levelsは1〜12の整数に限る", () => {
    expect(timelineQuerySchema.safeParse({ version: "33", levels: ["11", "12"] }).success).toBe(true);
    expect(timelineQuerySchema.safeParse({ version: "33", levels: ["0", "99"] }).success).toBe(false);
  });
});
