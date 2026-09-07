import type { NextApiRequest, NextApiResponse } from "next";
import {
  handleUpdateSongNote,
  handleDeleteSongNote,
} from "@/lib/subhandlers/songs";
import { writeV1Result } from "@/middlewares/api/apiResult";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "PATCH") {
    const { result } = await handleUpdateSongNote(req);
    return writeV1Result(res, result);
  }
  if (req.method === "DELETE") {
    const { result } = await handleDeleteSongNote(req);
    if (result.ok) {
      res.status(204).end();
      return;
    }
    return writeV1Result(res, result);
  }
  return res.status(405).end();
}
