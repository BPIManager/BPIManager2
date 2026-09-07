import type { NextApiRequest } from "next";
import { songNotesRepo } from "@/lib/db/domains/songNotes";
import { resolveOptionalUid } from "@/middlewares/api/resolveOptionalUid";
import { err, ok } from "@/middlewares/api/apiResult";
import { num, type HandleOutcome } from "./_shared";

export async function handleUpdateSongNote(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const noteId = num(req.query.noteId);
  if (noteId === null) {
    return {
      result: err(400, "Invalid noteId"),
      targetUserId: "",
      viewerId: null,
    };
  }
  const uid = (await resolveOptionalUid(req)) ?? null;
  const b = { targetUserId: uid ?? "", viewerId: uid };
  if (!uid) return { result: err(401, "Unauthorized"), ...b };

  const { body } = req.body ?? {};
  if (typeof body !== "string" || body.trim().length === 0) {
    return { result: err(400, "body is required"), ...b };
  }
  if (body.trim().length > 2000) {
    return { result: err(400, "body too long (max 2000)"), ...b };
  }
  const exists = await songNotesRepo.noteExists(noteId);
  if (!exists) return { result: err(404, "Note not found"), ...b };
  const updated = await songNotesRepo.updateNote(noteId, uid, body.trim());
  if (!updated) return { result: err(403, "Forbidden"), ...b };
  return { result: ok({ id: noteId }), ...b };
}

/** DELETE /songs/[songId]/notes/[noteId] （v1 は 204） */
export async function handleDeleteSongNote(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const noteId = num(req.query.noteId);
  if (noteId === null) {
    return {
      result: err(400, "Invalid noteId"),
      targetUserId: "",
      viewerId: null,
    };
  }
  const uid = (await resolveOptionalUid(req)) ?? null;
  const b = { targetUserId: uid ?? "", viewerId: uid };
  if (!uid) return { result: err(401, "Unauthorized"), ...b };

  const exists = await songNotesRepo.noteExists(noteId);
  if (!exists) return { result: err(404, "Note not found"), ...b };
  const deleted = await songNotesRepo.deleteNote(noteId, uid);
  if (!deleted) return { result: err(403, "Forbidden"), ...b };
  return { result: ok({ deleted: true }), successStatus: 204, ...b };
}

/** POST|DELETE /songs/[songId]/notes/[noteId]/upvote */
