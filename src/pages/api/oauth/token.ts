import { randomBytes } from "crypto";
import { NextApiRequest, NextApiResponse } from "next";
import { oauthRepo } from "@/lib/db/domains/oauth";
import { withRateLimit } from "@/middlewares/api/withRateLimit";
import { tokenRequestSchema } from "@/schemas/oauth";
import { timingSafeEqual } from "@/utils/common/timingSafeEqual";
import { verifyPkce } from "@/utils/oauth/pkce";

const ACCESS_TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * client_secret_basic(Authorizationヘッダー)またはclient_secret_post(body)の
 * どちらでも受け付ける。Basicヘッダーが有る場合はそちらのclient_idを優先する。
 */
function extractClientCredentials(
  req: NextApiRequest,
  bodyClientId: string,
  bodyClientSecret: string | undefined,
): { clientId: string; clientSecret: string | undefined } {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Basic ")) {
    const decoded = Buffer.from(authHeader.slice(6), "base64").toString(
      "utf-8",
    );
    const separatorIndex = decoded.indexOf(":");
    if (separatorIndex !== -1) {
      return {
        clientId: decoded.slice(0, separatorIndex),
        clientSecret: decoded.slice(separatorIndex + 1),
      };
    }
  }

  return { clientId: bodyClientId, clientSecret: bodyClientSecret };
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "invalid_request" });
  }

  const parsed = tokenRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "invalid_request",
      error_description:
        parsed.error.issues[0]?.message ?? "Invalid token request",
    });
  }

  const { grant_type, code, redirect_uri, code_verifier } = parsed.data;

  if (grant_type !== "authorization_code") {
    return res.status(400).json({ error: "unsupported_grant_type" });
  }

  const { clientId: client_id, clientSecret: client_secret } =
    extractClientCredentials(req, parsed.data.client_id, parsed.data.client_secret);

  try {
    const authCode = await oauthRepo.consumeAuthorizationCode(code);

    if (
      !authCode ||
      authCode.clientId !== client_id ||
      authCode.redirectUri !== redirect_uri
    ) {
      return res.status(400).json({ error: "invalid_grant" });
    }

    if (!verifyPkce(code_verifier, authCode.codeChallenge)) {
      return res.status(400).json({ error: "invalid_grant" });
    }

    const client = await oauthRepo.findClientById(client_id);

    // userIdが設定されているクライアント(Settings画面から手動発行)はconfidential
    // client扱いとし、client_secretの一致を必須にする。DCR発行のpublic clientは
    // userIdがnullのままなのでPKCEのみで完結する(現状維持)。
    if (client?.userId) {
      if (
        !client_secret ||
        !client.clientSecret ||
        !timingSafeEqual(client_secret, client.clientSecret)
      ) {
        return res.status(401).json({ error: "invalid_client" });
      }
    }

    const accessToken = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL_MS);

    await oauthRepo.createAccessToken({
      token: accessToken,
      userId: authCode.userId,
      clientId: client_id,
      expiresAt,
    });

    return res.status(200).json({
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: Math.floor(ACCESS_TOKEN_TTL_MS / 1000),
    });
  } catch (error: unknown) {
    console.error("OAuth Token Exchange Error:", error);
    return res.status(500).json({ error: "server_error" });
  }
}

export default withRateLimit(handler, { windowMs: 60_000, max: 30 });
