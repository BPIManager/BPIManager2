import { NextApiRequest, NextApiResponse } from "next";
import { oauthRepo } from "@/lib/db/oauth";
import { withRateLimit } from "@/middlewares/api/withRateLimit";

/**
 * 同意画面が接続元クライアントの身元(名前・リダイレクト先ホスト)を
 * 表示するための公開エンドポイント。ログイン前に呼ばれるため認証は不要。
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const clientId =
    typeof req.query.client_id === "string" ? req.query.client_id : undefined;
  if (!clientId) {
    return res.status(400).json({ message: "client_id is required" });
  }

  const client = await oauthRepo.findClientById(clientId);
  if (!client) {
    return res.status(404).json({ message: "Unknown client_id" });
  }

  const redirectHosts = client.redirectUris
    .map((uri) => {
      try {
        return new URL(uri).host;
      } catch {
        return null;
      }
    })
    .filter((host): host is string => host !== null);

  return res.status(200).json({
    clientName: client.clientName ?? null,
    redirectHosts,
  });
}

export default withRateLimit(handler, { windowMs: 60_000, max: 60 });
