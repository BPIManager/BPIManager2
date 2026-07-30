import { randomBytes } from "crypto";
import { NextApiRequest, NextApiResponse } from "next";
import { oauthRepo } from "@/lib/db/oauth";
import { registerClientSchema } from "@/schemas/oauth";
import { withRateLimit } from "@/middlewares/api/withRateLimit";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "invalid_request" });
  }

  const parsed = registerClientSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "invalid_client_metadata",
      error_description:
        parsed.error.issues[0]?.message ?? "Invalid client metadata",
    });
  }

  try {
    const clientId = randomBytes(16).toString("hex");
    const { redirect_uris, client_name } = parsed.data;

    await oauthRepo.registerClient(clientId, client_name, redirect_uris);

    return res.status(201).json({
      client_id: clientId,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_name,
      redirect_uris,
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code"],
      response_types: ["code"],
    });
  } catch (error: unknown) {
    console.error("OAuth Client Registration Error:", error);
    return res.status(500).json({ error: "server_error" });
  }
}

export default withRateLimit(handler, { windowMs: 60_000, max: 20 });
