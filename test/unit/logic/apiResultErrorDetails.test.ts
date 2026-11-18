import { describe, it, expect, vi } from "vitest";
import { err, writeV1Result, writeV2Result } from "@/middlewares/api/apiResult";

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
