import { handleAllScoresList } from "@/lib/subhandlers/allScores";
import { err, writeV1Result } from "@/middlewares/api/apiResult";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return writeV1Result(res, err(405, `Method ${req.method} Not Allowed`));
  }

  const { result } = await handleAllScoresList(req);
  writeV1Result(res, result);
}
