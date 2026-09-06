import type { NextApiRequest, NextApiResponse } from "next";
import { handleTokenExchange } from "@/lib/subhandlers/auth";
import { writeV2Result } from "@/middlewares/api/apiResult";
import { withRateLimit } from "@/middlewares/api/withRateLimit";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end();
    return;
  }
  const { result } = await handleTokenExchange(req);
  writeV2Result(res, result);
}

export default withRateLimit(handler, { windowMs: 60_000, max: 20 });
