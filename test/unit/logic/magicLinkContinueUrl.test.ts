import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/turnstile/verify", () => ({ verifyTurnstileToken: vi.fn(async () => true) }));
vi.mock("@/lib/firebase/identityToolkit", () => ({ sendEmailSignInLink: vi.fn(async () => undefined) }));

import { externalContinueUrl, handleSendMagicLink } from "@/lib/subhandlers/auth/emailLogin";
import { sendEmailSignInLink } from "@/lib/firebase/identityToolkit";

const ALLOWED = "https://camera.example.com, https://dev.tail1234.ts.net:10000/";

describe("externalContinueUrl", () => {
  it("許可したオリジンの /signin.html だけを受け付け、returnTo だけを引き継ぐ", () => {
    expect(externalContinueUrl("https://camera.example.com/signin.html?returnTo=%2F", ALLOWED)).toBe(
      "https://camera.example.com/signin.html?returnTo=%2F",
    );
    // ポート付きのオリジン・末尾の / つきの許可設定
    expect(externalContinueUrl("https://dev.tail1234.ts.net:10000/signin.html", ALLOWED)).toBe(
      "https://dev.tail1234.ts.net:10000/signin.html?returnTo=%2F",
    );
    // 余計なパラメータは捨てる
    expect(externalContinueUrl("https://camera.example.com/signin.html?returnTo=%2Fx&evil=1", ALLOWED)).toBe(
      "https://camera.example.com/signin.html?returnTo=%2Fx",
    );
  });

  it("returnTo が別サイト向け（//example.com や絶対 URL）なら、/ に直す", () => {
    expect(externalContinueUrl("https://camera.example.com/signin.html?returnTo=%2F%2Fevil.com", ALLOWED)).toContain("returnTo=%2F");
    expect(externalContinueUrl("https://camera.example.com/signin.html?returnTo=%2F%2Fevil.com", ALLOWED)).not.toContain("evil");
    expect(externalContinueUrl("https://camera.example.com/signin.html?returnTo=https%3A%2F%2Fevil.com", ALLOWED)).not.toContain("evil");
  });

  it("許可していないオリジン・別のパス・壊れた URL・文字列以外・許可設定が空なら null", () => {
    expect(externalContinueUrl("https://evil.example.com/signin.html", ALLOWED)).toBeNull();
    expect(externalContinueUrl("https://camera.example.com/other", ALLOWED)).toBeNull();
    expect(externalContinueUrl("https://camera.example.com.evil.com/signin.html", ALLOWED)).toBeNull();
    expect(externalContinueUrl("not a url", ALLOWED)).toBeNull();
    expect(externalContinueUrl(undefined, ALLOWED)).toBeNull();
    expect(externalContinueUrl("https://camera.example.com/signin.html", "")).toBeNull();
  });
});

describe("handleSendMagicLink の continueUrl", () => {
  const req = (body: unknown) => ({ body, headers: {}, socket: {} }) as never;

  it("許可された戻り先なら、そこを戻り先にしてメールを送る。省略すれば従来どおり BPIM 本体", async () => {
    process.env.EMAIL_LINK_ALLOWED_ORIGINS = "https://camera.example.com";
    process.env.BASEURL = "https://bpi2.example.com";
    const send = vi.mocked(sendEmailSignInLink);
    send.mockClear();

    const ok = await handleSendMagicLink(req({ email: "a@b.co", turnstileToken: "t", continueUrl: "https://camera.example.com/signin.html" }));
    expect(ok.result).toMatchObject({ ok: true });
    expect(send).toHaveBeenLastCalledWith("a@b.co", "https://camera.example.com/signin.html?returnTo=%2F");

    await handleSendMagicLink(req({ email: "a@b.co", turnstileToken: "t" }));
    expect(send).toHaveBeenLastCalledWith("a@b.co", "https://bpi2.example.com/auth/email-link?intent=login");
  });

  it("許可されていない戻り先は 400 で、メールを送らない", async () => {
    process.env.EMAIL_LINK_ALLOWED_ORIGINS = "https://camera.example.com";
    const send = vi.mocked(sendEmailSignInLink);
    send.mockClear();
    const r = await handleSendMagicLink(req({ email: "a@b.co", turnstileToken: "t", continueUrl: "https://evil.example.com/signin.html" }));
    expect(r.result).toMatchObject({ ok: false, status: 400 });
    expect(send).not.toHaveBeenCalled();
  });
});
