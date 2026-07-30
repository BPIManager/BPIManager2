import { randomBytes } from "crypto";
import { NextApiResponse } from "next";
import { oauthRepo } from "@/lib/db/oauth";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { consentSchema } from "@/schemas/oauth";
import { parseBody } from "@/services/nextRequest/parseBody";

const CODE_TTL_MS = 60_000;

async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const body = parseBody(consentSchema, req.body, res);
  if (!body) return;

  try {
    const client = await oauthRepo.findClientById(body.client_id);
    if (!client) {
      return res.status(400).json({ message: "Unknown client_id" });
    }

    if (!client.redirectUris.includes(body.redirect_uri)) {
      return res.status(400).json({ message: "redirect_uri not registered" });
    }

    const code = randomBytes(32).toString("hex");

    await oauthRepo.createAuthorizationCode({
      code,
      userId: req.authUid,
      clientId: body.client_id,
      redirectUri: body.redirect_uri,
      codeChallenge: body.code_challenge,
      codeChallengeMethod: body.code_challenge_method,
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    });

    const redirectUrl = new URL(body.redirect_uri);
    redirectUrl.searchParams.set("code", code);
    if (body.state) redirectUrl.searchParams.set("state", body.state);

    return res.status(200).json({ redirectUrl: redirectUrl.toString() });
  } catch (error: unknown) {
    console.error("OAuth Consent Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ message: errorMessage });
  }
}

export default withAuth(handler);
