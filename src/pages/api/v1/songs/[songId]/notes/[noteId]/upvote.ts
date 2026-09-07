import type { NextApiRequest, NextApiResponse } from "next";
import { handleSongNoteUpvote } from "@/lib/subhandlers/songs";
import { writeV1Result } from "@/middlewares/api/apiResult";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST" && req.method !== "DELETE") {
    return res.status(405).end();
  }
  const { result } = await handleSongNoteUpvote(req);
  writeV1Result(res, result);
}
