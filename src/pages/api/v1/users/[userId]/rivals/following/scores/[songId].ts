import type { NextApiRequest, NextApiResponse } from "next";
import { handleRivalFollowingScoresForSong } from "@/lib/subhandlers/rivals";
import { writeV1Result } from "@/middlewares/api/apiResult";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") return res.status(405).end();
  const { result } = await handleRivalFollowingScoresForSong(req);
  writeV1Result(res, result);
}
