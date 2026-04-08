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

function parseId(raw: string | string[] | undefined): number | null {
  if (!raw || Array.isArray(raw)) return null;
  const n = parseInt(raw, 10);
  return isNaN(n) ? null : n;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const noteId = parseId(req.query.noteId);
  if (noteId === null) return res.status(400).json({ message: "Invalid noteId" });

  if (req.method === "PATCH") {
    const uid = await requireAuth(req);
    if (!uid) return res.status(401).json({ message: "Unauthorized" });

    const { body } = req.body ?? {};
    if (typeof body !== "string" || body.trim().length === 0)
      return res.status(400).json({ message: "body is required" });
    if (body.trim().length > 2000)
      return res.status(400).json({ message: "body too long (max 2000)" });

    const exists = await songNotesRepo.noteExists(noteId);
    if (!exists) return res.status(404).json({ message: "Note not found" });

    const updated = await songNotesRepo.updateNote(noteId, uid, body.trim());
    if (!updated)
      return res.status(403).json({ message: "Forbidden" });

    return res.status(200).json({ id: noteId });
  }

  if (req.method === "DELETE") {
    const uid = await requireAuth(req);
    if (!uid) return res.status(401).json({ message: "Unauthorized" });

    const exists = await songNotesRepo.noteExists(noteId);
    if (!exists) return res.status(404).json({ message: "Note not found" });

    const deleted = await songNotesRepo.deleteNote(noteId, uid);
    if (!deleted)
      return res.status(403).json({ message: "Forbidden" });

    return res.status(204).end();
  }

  return res.status(405).end();
}
