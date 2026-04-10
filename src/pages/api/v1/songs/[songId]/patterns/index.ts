import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth } from "@/lib/firebase/admin";
import { songPatternsRepo } from "@/lib/db/songPatterns";

async function resolveUid(req: NextApiRequest): Promise<string> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return "";
  try {
    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
    return decoded.uid;
  } catch {
    return "";
  }
}

function parseSongId(raw: string | string[] | undefined): number | null {
  if (!raw || Array.isArray(raw)) return null;
  const n = parseInt(raw, 10);
  return isNaN(n) ? null : n;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") return res.status(405).end();

  const songId = parseSongId(req.query.songId);
  if (songId === null) return res.status(400).json({ message: "Invalid songId" });

  const cursorRaw = req.query.cursor;
  const cursor =
    cursorRaw && !Array.isArray(cursorRaw) ? parseInt(cursorRaw, 10) : 0;
  if (isNaN(cursor) || cursor < 0)
    return res.status(400).json({ message: "Invalid cursor" });

  const sortByRaw = req.query.sortBy;
  const sortBy =
    sortByRaw === "upvote" || sortByRaw === "score"
      ? sortByRaw
      : "score";

  const viewerId = await resolveUid(req);
  const page = await songPatternsRepo.getPatterns(songId, cursor, viewerId, sortBy);
  return res.status(200).json(page);
}
