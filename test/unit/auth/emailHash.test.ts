import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { hashEmail } from "@/lib/auth/emailHash";
import { isValidEmail, normalizeEmail } from "@/utils/common/email";

describe("normalizeEmail / isValidEmail", () => {
  it("前後の空白を除き小文字化する", () => {
    expect(normalizeEmail("  Foo@Example.COM ")).toBe("foo@example.com");
  });

  it("形式が妥当なアドレスを受け入れ、不正なものを拒否する", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("user@example")).toBe(false);
    expect(isValidEmail("user @example.com")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});

describe("hashEmail", () => {
  const originalPepper = process.env.EMAIL_HASH_PEPPER;

  beforeEach(() => {
    process.env.EMAIL_HASH_PEPPER = "test-pepper";
  });

  afterEach(() => {
    process.env.EMAIL_HASH_PEPPER = originalPepper;
  });

  it("64文字の hex を返し、大文字小文字・前後空白の違いを同一視する", () => {
    const hash = hashEmail("User@Example.com");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hashEmail("  user@example.com ")).toBe(hash);
  });

  it("pepper が違えば別のハッシュになる", () => {
    const withTestPepper = hashEmail("user@example.com");
    process.env.EMAIL_HASH_PEPPER = "another-pepper";
    expect(hashEmail("user@example.com")).not.toBe(withTestPepper);
  });

  it("pepper が未設定の場合は例外を投げ、ハッシュなしで進まない", () => {
    delete process.env.EMAIL_HASH_PEPPER;
    expect(() => hashEmail("user@example.com")).toThrow("EMAIL_HASH_PEPPER is not set");
  });
});
