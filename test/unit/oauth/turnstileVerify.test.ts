import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verifyTurnstileToken } from "@/lib/turnstile/verify";

describe("verifyTurnstileToken", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    process.env.TURNSTILE_SECRET_KEY = "secret";
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.TURNSTILE_SECRET_KEY;
  });

  it("success: true のときだけ true", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    expect(await verifyTurnstileToken("t")).toBe(true);
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: false }) });
    expect(await verifyTurnstileToken("t")).toBe(false);
  });

  it("シークレット未設定・空トークン・通信失敗・HTTP エラーは false", async () => {
    expect(await verifyTurnstileToken("")).toBe(false);
    fetchMock.mockRejectedValue(new Error("net"));
    expect(await verifyTurnstileToken("t")).toBe(false);
    fetchMock.mockResolvedValue({ ok: false });
    expect(await verifyTurnstileToken("t")).toBe(false);
    delete process.env.TURNSTILE_SECRET_KEY;
    expect(await verifyTurnstileToken("t")).toBe(false);
  });

  it("remoteIp があれば送る", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    await verifyTurnstileToken("t", "203.0.113.1");
    const body = fetchMock.mock.calls[0][1].body as URLSearchParams;
    expect(body.get("remoteip")).toBe("203.0.113.1");
  });
});
