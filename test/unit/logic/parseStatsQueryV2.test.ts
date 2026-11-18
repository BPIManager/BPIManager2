import { describe, it, expect, vi } from "vitest";
import {
  parseStatsQuery,
  parseStatsQueryV2,
  statsQueryJsonSchema,
} from "@/services/nextRequest/parseStatsQueries";
import { missingParams } from "@/middlewares/api/apiResult";

const mockRes = () => {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
};

describe("parseStatsQueryV2", () => {
  it("正しいクエリは v1 と同じ StatsQuery を返す", () => {
    const q = { userId: "u", version: "34", level: "12", difficulty: "ANOTHER" };
    expect(parseStatsQueryV2(q, mockRes() as never)).toEqual(
      parseStatsQuery(q, mockRes() as never),
    );
  });

  it("不正なクエリは v2 エンベロープ（errorDetails つき）で 400 を返し、メッセージは v1 と同じ", () => {
    const q = { userId: "u", version: "34", level: "abc" };
    const v1 = mockRes();
    const v2 = mockRes();
    expect(parseStatsQuery(q, v1 as never)).toBeNull();
    expect(parseStatsQueryV2(q, v2 as never)).toBeNull();

    const v1Message = v1.json.mock.calls[0][0].message;
    const payload = v2.json.mock.calls[0][0];
    expect(v2.status).toHaveBeenCalledWith(400);
    expect(payload).toMatchObject({ error: true, errorMessage: v1Message, body: null });
    expect(payload.errorDetails.in).toBe("query");
    expect(payload.errorDetails.issues.length).toBeGreaterThan(0);
    // v1 の形状は変わらない
    expect(v1.json.mock.calls[0][0]).toEqual({ message: v1Message });
  });
});

describe("statsQueryJsonSchema / missingParams", () => {
  it("バージョン・レベル・難易度の列挙値を含む", () => {
    type Prop = { enum?: unknown[]; items?: { enum?: unknown[] } };
    const p = (statsQueryJsonSchema() as { properties: Record<string, Prop> }).properties;
    expect(p.version.enum).toContain("INF");
    expect(p.level.items?.enum).toEqual([11, 12]);
    expect(p.difficulty.items?.enum).toEqual(["HYPER", "ANOTHER", "LEGGENDARIA"]);
  });

  it("missingParams はメッセージを保ち、必要なパラメータ名と schema を返す", () => {
    const r = missingParams(["level", "difficulty"], { type: "object" }, { in: "query", hint: "どちらか" });
    expect(r).toMatchObject({
      ok: false,
      status: 400,
      message: "Required parameters are missing",
      details: {
        in: "query",
        issues: [{ path: ["level", "difficulty"], code: "missing_parameters", message: "どちらか" }],
        schema: { type: "object" },
      },
    });
  });
});
