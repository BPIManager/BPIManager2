import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth } from "@/lib/firebase/admin";
import { songPatternsRepo } from "@/lib/db/songPatterns";
import type { VoteType } from "@/types/db";

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
  const songId = parseSongId(req.query.songId);
  if (songId === null) return res.status(400).json({ message: "Invalid songId" });

  const pattern = req.query.pattern;
  if (!pattern || Array.isArray(pattern))
    return res.status(400).json({ message: "Invalid pattern" });

  const uid = await resolveUid(req);
  if (!uid) return res.status(401).json({ message: "Unauthorized" });

  if (req.method === "POST") {
    const { voteType } = req.body ?? {};
    if (voteType !== "upvote" && voteType !== "downvote")
      return res.status(400).json({ message: "voteType must be upvote or downvote" });

    await songPatternsRepo.vote(songId, pattern, uid, voteType as VoteType);
    return res.status(200).json({ ok: true });
  }

  if (req.method === "DELETE") {
    await songPatternsRepo.deleteVote(songId, pattern, uid);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
