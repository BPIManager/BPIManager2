import { describe, expect, it, vi } from "vitest";
import type { NextApiRequest, NextApiResponse } from "next";
import { withRateLimit } from "@/middlewares/api/withRateLimit";

function makeReq(url: string, ip: string): NextApiRequest {
  return { url, headers: {}, socket: { remoteAddress: ip } } as unknown as NextApiRequest;
}

function makeRes() {
  const res = {
    statusCode: 200,
    setHeader: vi.fn(),
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as NextApiResponse & { statusCode: number };
}

describe("withRateLimit", () => {
  it("name 未指定でも、ルートごとに独立したカウンタになる", async () => {
    const handler = vi.fn();
    const a = withRateLimit(handler, { windowMs: 60_000, max: 2 });
    const b = withRateLimit(handler, { windowMs: 60_000, max: 2 });
    const ip = "203.0.113.10";

    for (let i = 0; i < 2; i++) await a(makeReq("/api/route-a?x=1", ip), makeRes());
    const resA = makeRes();
    await a(makeReq("/api/route-a", ip), resA);
    expect(resA.statusCode).toBe(429);

    const resB = makeRes();
    await b(makeReq("/api/route-b", ip), resB);
    expect(resB.statusCode).toBe(200);
  });

  it("name 指定時はそちらがキーになる", async () => {
    const handler = vi.fn();
    const a = withRateLimit(handler, { windowMs: 60_000, max: 1, name: "n" });
    const ip = "203.0.113.11";
    await a(makeReq("/api/x", ip), makeRes());
    const res = makeRes();
    await a(makeReq("/api/y", ip), res);
    expect(res.statusCode).toBe(429);
  });
});
