import type { NextApiRequest, NextApiResponse } from "next";
import {
  handleUpdateSongNote,
  handleDeleteSongNote,
} from "@/lib/subhandlers/songs";
import {
  buildMeta,
  withMeta,
  writeV2Result,
  err,
} from "@/middlewares/api/apiResult";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "PATCH" && req.method !== "DELETE") {
    writeV2Result(res, err(405, "Method Not Allowed"));
    return;
  }
  const { result, targetUserId, viewerId } =
    req.method === "PATCH"
      ? await handleUpdateSongNote(req)
      : await handleDeleteSongNote(req);
  writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
}
