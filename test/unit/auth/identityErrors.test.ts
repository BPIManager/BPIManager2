import { describe, it, expect, vi, beforeEach } from "vitest";
import { IdentityToolkitError } from "@/lib/firebase/identityToolkitError";
import { mapIdentityToolkitError } from "@/lib/subhandlers/auth/_errors";

describe("mapIdentityToolkitError", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("送信回数の上限は 429 に対応付ける", () => {
    const result = mapIdentityToolkitError(new IdentityToolkitError(400, "TOO_MANY_ATTEMPTS_TRY_LATER"));
    expect(result).toMatchObject({ ok: false, status: 429 });
  });

  it("形式エラーは 400、既に使用済みのアドレスは 409 に対応付ける", () => {
    expect(mapIdentityToolkitError(new IdentityToolkitError(400, "INVALID_EMAIL"))).toMatchObject({ status: 400 });
    expect(mapIdentityToolkitError(new IdentityToolkitError(400, "EMAIL_EXISTS"))).toMatchObject({ status: 409 });
  });

  it("未知のエラーは 500 とし、メッセージに詳細を含めない", () => {
    const result = mapIdentityToolkitError(new Error("connect ECONNRESET user@example.com"));
    expect(result).toEqual({ ok: false, status: 500, message: "Internal Server Error" });
  });
});
