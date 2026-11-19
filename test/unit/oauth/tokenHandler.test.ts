import { createHash } from "crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextApiRequest, NextApiResponse } from "next";

const repo = vi.hoisted(() => ({
  findActiveAuthorizationCode: vi.fn(),
  consumeAuthorizationCode: vi.fn(),
  findClientById: vi.fn(),
  createAccessToken: vi.fn(),
}));
vi.mock("@/lib/db/domains/oauth", () => ({ oauthRepo: repo }));

import handler from "@/pages/api/oauth/token";
import { hashCredential } from "@/utils/common/hashCredential";

const verifier = "v".repeat(43);
const challenge = createHash("sha256").update(verifier).digest("base64url");
const REDIRECT = "https://app.example.com/cb";

const authCode = {
  clientId: "cid",
  redirectUri: REDIRECT,
  codeChallenge: challenge,
  userId: "u1",
};

let ipCounter = 0;
function req(body: Record<string, unknown>, headers: Record<string, string> = {}) {
  ipCounter += 1;
  return {
    method: "POST",
    url: "/api/oauth/token",
    body,
    headers,
    socket: { remoteAddress: `198.51.100.${ipCounter}` },
  } as unknown as NextApiRequest;
}

function res() {
  const r = {
    statusCode: 200,
    payload: undefined as unknown,
    setHeader: vi.fn(),
    status(c: number) {
      this.statusCode = c;
      return this;
    },
    json(p: unknown) {
      this.payload = p;
      return this;
    },
  };
  return r as unknown as NextApiResponse & { statusCode: number; payload: any };
}

const baseBody = {
  grant_type: "authorization_code",
  code: "code",
  redirect_uri: REDIRECT,
  client_id: "cid",
  code_verifier: verifier,
};

describe("POST /api/oauth/token", () => {
  beforeEach(() => {
    Object.values(repo).forEach((f) => f.mockReset());
    repo.findActiveAuthorizationCode.mockResolvedValue(authCode);
    repo.consumeAuthorizationCode.mockResolvedValue(authCode);
    repo.createAccessToken.mockResolvedValue(undefined);
  });

  it("public クライアントは PKCE のみでトークンを発行する", async () => {
    repo.findClientById.mockResolvedValue({ userId: null });
    const r = res();
    await handler(req(baseBody), r);
    expect(r.statusCode).toBe(200);
    expect(r.payload.token_type).toBe("Bearer");
    expect(repo.consumeAuthorizationCode).toHaveBeenCalledTimes(1);
  });

  it("PKCE が一致しないときは認可コードを消費しない", async () => {
    repo.findClientById.mockResolvedValue({ userId: null });
    const r = res();
    await handler(req({ ...baseBody, code_verifier: "x".repeat(43) }), r);
    expect(r.statusCode).toBe(400);
    expect(repo.consumeAuthorizationCode).not.toHaveBeenCalled();
  });

  it("confidential クライアントの secret が誤りなら 401 で、認可コードを消費しない", async () => {
    repo.findClientById.mockResolvedValue({ userId: "u1", clientSecret: hashCredential("right") });
    const r = res();
    await handler(req({ ...baseBody, client_secret: "wrong" }), r);
    expect(r.statusCode).toBe(401);
    expect(repo.consumeAuthorizationCode).not.toHaveBeenCalled();
  });

  it("client_secret_basic（body に client_id なし）で発行できる", async () => {
    repo.findClientById.mockResolvedValue({ userId: "u1", clientSecret: hashCredential("right") });
    const { client_id: _omit, ...noClientId } = baseBody;
    const basic = Buffer.from("cid:right").toString("base64");
    const r = res();
    await handler(req(noClientId, { authorization: `Basic ${basic}` }), r);
    expect(r.statusCode).toBe(200);
  });

  it("client_id がどこにもなければ 401", async () => {
    const { client_id: _omit, ...noClientId } = baseBody;
    const r = res();
    await handler(req(noClientId), r);
    expect(r.statusCode).toBe(401);
  });

  it("コードの同時使用で消費に失敗したら invalid_grant", async () => {
    repo.findClientById.mockResolvedValue({ userId: null });
    repo.consumeAuthorizationCode.mockResolvedValue(null);
    const r = res();
    await handler(req(baseBody), r);
    expect(r.statusCode).toBe(400);
    expect(repo.createAccessToken).not.toHaveBeenCalled();
  });
});
