import { createHash } from "crypto";

/**
 * PKCE (RFC 7636) の code_verifier が code_challenge (S256) と一致するか検証する。
 */
export function verifyPkce(codeVerifier: string, codeChallenge: string) {
  const computed = createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  return computed === codeChallenge;
}
