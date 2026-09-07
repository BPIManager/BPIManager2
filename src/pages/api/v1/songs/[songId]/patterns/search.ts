import type { NextApiRequest, NextApiResponse } from "next";
import { handleSongPatternSearch } from "@/lib/subhandlers/songs";
import { writeV1Result } from "@/middlewares/api/apiResult";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") return res.status(405).end();
  const { result } = await handleSongPatternSearch(req);
  writeV1Result(res, result);
}
