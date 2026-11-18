import { describe, it, expect, vi } from "vitest";
import Ajv2020 from "ajv/dist/2020";
import {
  parseStatsQueryV2RequiringFilter,
  statsQueryJsonSchemaRequiringFilter,
} from "@/services/nextRequest/parseStatsQueries";

const mockRes = () => {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
};

// HTTP のクエリは文字列。ajv にも同じ型変換（スカラ→配列、文字列→数値）をさせて比べる
const ajv = new Ajv2020({ coerceTypes: "array", useDefaults: true, strict: false });
const schemaAccepts = (input: Record<string, unknown>) =>
  ajv.compile(statsQueryJsonSchemaRequiringFilter() as object)({ ...input });
const validatorAccepts = (input: Record<string, unknown>) =>
  parseStatsQueryV2RequiringFilter(input as never, mockRes() as never) !== null;

describe("stats 系クエリ: 検証ロジックと、返す JSON Schema の整合", () => {
  const cases: Record<string, unknown>[] = [
    {},
    { level: "12" },
    { level: ["11", "12"] },
    { difficulty: "ANOTHER" },
    { level: "12", difficulty: "HYPER" },
    // 検証が拒否する入力
    { version: "34" },
    { level: "5" },
    { level: [] },
    { difficulty: "NORMAL" },
    { difficulty: [] },
    { level: "abc" },
  ];

  it.each(cases.map((c) => [JSON.stringify(c), c] as const))(
    "検証が拒否する入力 %s は、スキーマも拒否する",
    (_label, input) => {
      if (!validatorAccepts(input)) {
        expect(schemaAccepts(input)).toBe(false);
      }
    },
  );

  it("level も difficulty も無い入力は、検証もスキーマも拒否する（{} が妥当になってはいけない）", () => {
    expect(validatorAccepts({})).toBe(false);
    expect(schemaAccepts({})).toBe(false);
  });

  it("正しい入力は、検証もスキーマも受け付ける", () => {
    for (const input of [{ level: "12" }, { difficulty: "ANOTHER" }, { level: ["11", "12"], difficulty: ["HYPER"] }]) {
      expect(validatorAccepts(input)).toBe(true);
      expect(schemaAccepts(input)).toBe(true);
    }
  });
});
