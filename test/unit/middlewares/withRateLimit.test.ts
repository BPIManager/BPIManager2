import { describe, it, expect, vi } from "vitest";
import type { NextApiRequest } from "next";
import { withRateLimit } from "@/middlewares/api/withRateLimit";

function createMockReqRes(ip: string) {
  const req = {
    headers: { "x-forwarded-for": ip },
    socket: { remoteAddress: ip },
  } as unknown as NextApiRequest;

  const res = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    setHeader(key: string, value: string) {
      this.headers[key] = value;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };

  return { req, res };
}

describe("withRateLimit", () => {
  it("上限までは通常通りハンドラーを呼び出すこと", async () => {
    const handler = vi.fn(async (_req, res) => {
      res.status(200).json({ ok: true });
    });
    const wrapped = withRateLimit(handler, { windowMs: 60_000, max: 3 });

    for (let i = 0; i < 3; i++) {
      const { req, res } = createMockReqRes("198.51.100.1");
      await wrapped(req, res as never);
      expect(res.statusCode).toBe(200);
    }
    expect(handler).toHaveBeenCalledTimes(3);
  });

  it("上限を超えたリクエストは429を返しハンドラーを呼び出さないこと", async () => {
    const handler = vi.fn(async (_req, res) => {
      res.status(200).json({ ok: true });
    });
    const wrapped = withRateLimit(handler, { windowMs: 60_000, max: 2 });
    const ip = "198.51.100.2";

    for (let i = 0; i < 2; i++) {
      const { req, res } = createMockReqRes(ip);
      await wrapped(req, res as never);
    }

    const { req, res } = createMockReqRes(ip);
    await wrapped(req, res as never);

    expect(res.statusCode).toBe(429);
    expect(res.headers["Retry-After"]).toBeDefined();
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("異なるIPは別々にカウントされること", async () => {
    const handler = vi.fn(async (_req, res) => {
      res.status(200).json({ ok: true });
    });
    const wrapped = withRateLimit(handler, { windowMs: 60_000, max: 1 });

    const a = createMockReqRes("198.51.100.10");
    await wrapped(a.req, a.res as never);
    expect(a.res.statusCode).toBe(200);

    const b = createMockReqRes("198.51.100.11");
    await wrapped(b.req, b.res as never);
    expect(b.res.statusCode).toBe(200);
  });
});
