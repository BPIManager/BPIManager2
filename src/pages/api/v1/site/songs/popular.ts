import { handleSongPopulation } from "@/lib/subhandlers/site";
import { writeV1Result } from "@/middlewares/api/apiResult";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  res.setHeader(
    "Cache-Control",
    "public, max-age=3600, stale-while-revalidate=86400",
  );
  writeV1Result(res, await handleSongPopulation(req));
}
