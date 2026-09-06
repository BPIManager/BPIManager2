import { handleSiteStats } from "@/lib/subhandlers/site";
import { writeV2Result } from "@/middlewares/api/apiResult";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  res.setHeader(
    "Cache-Control",
    "public, max-age=3600, stale-while-revalidate=86400",
  );
  writeV2Result(res, await handleSiteStats());
}
