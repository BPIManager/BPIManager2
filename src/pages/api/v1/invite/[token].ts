import type { NextApiRequest, NextApiResponse } from "next";
import { handleResolveInvite } from "@/lib/subhandlers/auth";
import { writeV1Result } from "@/middlewares/api/apiResult";
import { withRateLimit } from "@/middlewares/api/withRateLimit";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }
  const { result } = await handleResolveInvite(req);
  writeV1Result(res, result);
}

// 認証不要の公開エンドポイントのため、トークン試行によるDB負荷を抑える
export default withRateLimit(handler, { windowMs: 60_000, max: 30 });
