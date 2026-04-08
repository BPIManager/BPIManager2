import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth } from "@/lib/firebase/admin";
import { songNotesRepo } from "@/lib/db/songNotes";

async function requireAuth(req: NextApiRequest): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
    return decoded.uid;
  } catch {
    return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const raw = req.query.noteId;
  if (!raw || Array.isArray(raw)) return res.status(400).json({ message: "Invalid noteId" });
  const noteId = parseInt(raw, 10);
  if (isNaN(noteId)) return res.status(400).json({ message: "Invalid noteId" });

  if (req.method !== "POST" && req.method !== "DELETE")
    return res.status(405).end();

  const uid = await requireAuth(req);
  if (!uid) return res.status(401).json({ message: "Unauthorized" });

  const exists = await songNotesRepo.noteExists(noteId);
  if (!exists) return res.status(404).json({ message: "Note not found" });

  if (req.method === "POST") {
    const upvoteCount = await songNotesRepo.addUpvote(noteId, uid);
    return res.status(200).json({ upvoteCount });
  }

  const upvoteCount = await songNotesRepo.removeUpvote(noteId, uid);
  return res.status(200).json({ upvoteCount });
}
