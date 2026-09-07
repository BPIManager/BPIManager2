import type { NextApiRequest, NextApiResponse } from "next";
import { handleTokenExchange } from "@/lib/subhandlers/auth";
import { writeV1Result } from "@/middlewares/api/apiResult";
import { withRateLimit } from "@/middlewares/api/withRateLimit";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }
  const { result } = await handleTokenExchange(req);
  writeV1Result(res, result);
}

export default withRateLimit(handler, { windowMs: 60_000, max: 20 });
