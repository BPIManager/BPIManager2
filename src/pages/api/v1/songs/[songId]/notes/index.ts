import type { NextApiRequest, NextApiResponse } from "next";
import {
  handleSongNotesList,
  handleCreateSongNote,
} from "@/lib/subhandlers/songs";
import { writeV1Result } from "@/middlewares/api/apiResult";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    const { result } = await handleSongNotesList(req);
    return writeV1Result(res, result);
  }
  if (req.method === "POST") {
    const { result, successStatus } = await handleCreateSongNote(req);
    return writeV1Result(res, result, undefined, successStatus ?? 200);
  }
  return res.status(405).end();
}
