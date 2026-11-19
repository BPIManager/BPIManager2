import { createHash } from "crypto";
import { describe, expect, it } from "vitest";
import { verifyPkce } from "@/utils/oauth/pkce";
import { isSafeRedirectUri } from "@/schemas/oauth";

const challengeOf = (v: string) => createHash("sha256").update(v).digest("base64url");

describe("verifyPkce", () => {
  const verifier = "a".repeat(43);
  it("S256 で一致する verifier を受け入れる", () => {
    expect(verifyPkce(verifier, challengeOf(verifier))).toBe(true);
  });
  it("一致しない verifier / 平文の challenge を拒否する", () => {
    expect(verifyPkce("b".repeat(43), challengeOf(verifier))).toBe(false);
    expect(verifyPkce(verifier, verifier)).toBe(false);
  });
});

describe("isSafeRedirectUri", () => {
  it.each([
    ["https://example.com/cb", true],
    ["http://localhost:3000/cb", true],
    ["http://127.0.0.1/cb", true],
    ["http://[::1]:8080/cb", true],
    ["http://example.com/cb", false],
    ["javascript:alert(1)", false],
    ["data:text/html,x", false],
    ["ftp://example.com", false],
    ["not a url", false],
    ["", false],
  ])("%s -> %s", (uri, expected) => {
    expect(isSafeRedirectUri(uri)).toBe(expected);
  });
});
