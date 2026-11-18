import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import {
  err,
  invalidBody,
  invalidQuery,
  writeV1Result,
  writeV2Result,
} from "@/middlewares/api/apiResult";

const mockRes = () => {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
};

const details = {
  issues: [{ path: ["difficulty"], code: "invalid_value", message: "bad" }],
  schema: { type: "object" },
};

describe("エラー詳細(details)の書き出し", () => {
  it("v2: errorDetails として返し、body は null のまま", () => {
    const res = mockRes();
    writeV2Result(res as never, err(400, "Invalid parameters", details));
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: true,
      errorMessage: "Invalid parameters",
      body: null,
      errorDetails: details,
    });
  });

  it("v2: details が無いエラーは従来と同じ形状", () => {
    const res = mockRes();
    writeV2Result(res as never, err(404, "Song not found"));
    expect(res.json).toHaveBeenCalledWith({
      error: true,
      errorMessage: "Song not found",
      body: null,
    });
  });

  it("v1: details があっても従来どおり message のみを返す（v1 の形状は変えない）", () => {
    const res = mockRes();
    writeV1Result(res as never, err(400, "Invalid parameters", details));
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid parameters" });
  });
});

describe("invalidQuery / invalidBody", () => {
  const schema = z.object({ version: z.enum(["33", "34"]), n: z.coerce.number().int() });

  it("メッセージは従来と同じ（最初の issue のメッセージ）で、issues・JSON Schema・置き場所を付ける", () => {
    const parsed = schema.safeParse({ version: "1", n: "x" });
    if (parsed.success) throw new Error("unreachable");
    const r = invalidQuery(parsed.error, schema);
    expect(r).toMatchObject({ ok: false, status: 400, message: parsed.error.issues[0].message });
    const d = (r as { details: { in: string; issues: unknown[]; schema: { properties: object } } }).details;
    expect(d.in).toBe("query");
    expect(d.issues).toHaveLength(2);
    expect(Object.keys(d.schema.properties)).toEqual(["version", "n"]);
  });

  it("issue のメッセージが無いときは従来の既定文を使う", () => {
    const e = new z.ZodError([]);
    expect(invalidQuery(e, schema)).toMatchObject({ message: "Invalid query parameters" });
    expect(invalidBody(e, schema)).toMatchObject({ message: "Invalid request body", details: { in: "body" } });
  });

  it("JSON Schema に変換できない型があってもエラー応答は返す", () => {
    const custom = z.object({ d: z.custom<Date>((v) => v instanceof Date) });
    const parsed = custom.safeParse({ d: 1 });
    if (parsed.success) throw new Error("unreachable");
    expect(invalidBody(parsed.error, custom)).toMatchObject({ ok: false, status: 400 });
  });
});
