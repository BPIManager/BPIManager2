import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

vi.mock("@/lib/firebase/admin", () => ({
  adminAuth: { verifyIdToken: vi.fn() },
}));
// アクセス確認は通ったことにして、ハンドラの例外から 500 になる経路だけを見る
vi.mock("@/middlewares/api/withApi", () => ({
  checkUserAccess: vi.fn(async () => ({ hasAccess: true, viewerId: null })),
  rejectAccess: vi.fn(),
}));

import { writeMiddlewareError } from "@/middlewares/api/apiResult";
import { withAuth } from "@/middlewares/api/withAuth";
import { withRateLimit } from "@/middlewares/api/withRateLimit";
import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";

const mockRes = () => {
  const res = { status: vi.fn(), json: vi.fn(), setHeader: vi.fn(), headersSent: false };
  res.status.mockReturnValue(res);
  return res as unknown as NextApiResponse & {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
};
const req = (url: string, extra: Record<string, unknown> = {}) =>
  ({ url, headers: {}, query: {}, socket: { remoteAddress: "1.1.1.1" }, ...extra }) as unknown as NextApiRequest;

describe("共有ミドルウェアのエラー応答: v2 はエンベロープ、v1 は従来の { message }", () => {
  beforeEach(() => vi.clearAllMocks());

  it("writeMiddlewareError", () => {
    const v2 = mockRes();
    writeMiddlewareError(req("/api/v2/x"), v2, 403, "no");
    expect(v2.status).toHaveBeenCalledWith(403);
    expect(v2.json).toHaveBeenCalledWith({ error: true, errorMessage: "no", body: null, errorDetails: null });

    const v1 = mockRes();
    writeMiddlewareError(req("/api/v1/x"), v1, 403, "no");
    expect(v1.json).toHaveBeenCalledWith({ message: "no" });
  });

  it("withAuth: トークンが無いと 401（v2 エンベロープ / v1 は message のみ）", async () => {
    const handler = withAuth(vi.fn());
    const v2 = mockRes();
    await handler(req("/api/v2/users/u/scores") as never, v2);
    expect(v2.status).toHaveBeenCalledWith(401);
    expect(v2.json).toHaveBeenCalledWith({
      error: true,
      errorMessage: "Missing or invalid token",
      body: null,
      errorDetails: null,
    });
    const v1 = mockRes();
    await handler(req("/api/v1/users/u/scores") as never, v1);
    expect(v1.json).toHaveBeenCalledWith({ message: "Missing or invalid token" });
  });

  it("withRateLimit: 制限超過で 429（v2 エンベロープ / v1 は message のみ）", async () => {
    const limited = withRateLimit(vi.fn(), { windowMs: 60_000, max: 1, name: "t-v2" });
    await limited(req("/api/v2/a"), mockRes());
    const v2 = mockRes();
    await limited(req("/api/v2/a"), v2);
    expect(v2.status).toHaveBeenCalledWith(429);
    expect(v2.json).toHaveBeenCalledWith({ error: true, errorMessage: "Too Many Requests", body: null, errorDetails: null });

    const limited1 = withRateLimit(vi.fn(), { windowMs: 60_000, max: 1, name: "t-v1" });
    await limited1(req("/api/v1/a"), mockRes());
    const v1 = mockRes();
    await limited1(req("/api/v1/a"), v1);
    expect(v1.json).toHaveBeenCalledWith({ message: "Too Many Requests" });
  });

  it("withUserApiHandler: 例外の 500（v2 エンベロープ / v1 は message のみ）", async () => {
    const boom = () => {
      throw new Error("x");
    };
    const wrapped = withUserApiHandler(() => ({ userId: "u" }), boom as never, {
      onReject: () => undefined,
    });
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const v2 = mockRes();
    await wrapped(req("/api/v2/users/u/x", { query: { userId: "u" } }), v2);
    expect(v2.status).toHaveBeenCalledWith(500);
    const body = (v2.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(body).toMatchObject({ error: true, body: null, errorDetails: null });
    const v1 = mockRes();
    await wrapped(req("/api/v1/users/u/x", { query: { userId: "u" } }), v1);
    expect((v1.json as ReturnType<typeof vi.fn>).mock.calls[0][0]).toEqual({ message: expect.any(String) });
  });
});

describe("v2 ルート: エラー応答を直接書かない（writeV2Result を使う）", () => {
  const walk = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = path.join(dir, e.name);
      return e.isDirectory() ? walk(p) : p.endsWith(".ts") ? [p] : [];
    });
  const files = walk(path.resolve(__dirname, "../../../src/pages/api/v2"));

  it("res.status(4xx/5xx) や json({ message }) で、エンベロープを使わずにエラーを返していない", () => {
    const offenders = files.filter((f) => {
      const src = fs.readFileSync(f, "utf8");
      return /res\s*\.status\((4|5)\d\d\)|json\(\{\s*message/.test(src);
    });
    expect(offenders).toEqual([]);
  });
});
