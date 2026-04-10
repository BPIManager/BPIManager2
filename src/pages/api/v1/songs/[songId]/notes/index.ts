import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth } from "@/lib/firebase/admin";
import { songNotesRepo } from "@/lib/db/songNotes";

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

  if (req.method === "GET") {
    const sort =
      req.query.sort === "bpi" ? "bpi" : ("latest" as "latest" | "bpi");
    const viewerId = await resolveUid(req);
    const notes = await songNotesRepo.getNotes(songId, viewerId, sort);
    return res.status(200).json(notes);
  }

  if (req.method === "POST") {
    const uid = await resolveUid(req);
    if (!uid) return res.status(401).json({ message: "Unauthorized" });

    const { body } = req.body ?? {};
    if (typeof body !== "string" || body.trim().length === 0)
      return res.status(400).json({ message: "body is required" });
    if (body.trim().length > 2000)
      return res.status(400).json({ message: "body too long (max 2000)" });

    const id = await songNotesRepo.createNote(songId, uid, body.trim());
    return res.status(201).json({ id });
  }

  return res.status(405).end();
}
