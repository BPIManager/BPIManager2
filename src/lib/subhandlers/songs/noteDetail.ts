import type { NextApiRequest } from "next";
import { songNotesRepo } from "@/lib/db/domains/songNotes";
import { resolveOptionalUid } from "@/middlewares/api/resolveOptionalUid";
import { err, ok } from "@/middlewares/api/apiResult";
import { type HandleOutcome } from "./_shared";
import { invalidParam, parseIntParam } from "@/lib/validation/params";
import { parseInput } from "@/lib/validation/parse";
import { noteBodySchema } from "@/schemas/songs/input";

export async function handleUpdateSongNote(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const noteId = parseIntParam("noteId", req.query.noteId);
  if (noteId === null) {
    return {
      result: invalidParam("noteId", req.query.noteId, "Invalid noteId"),
      targetUserId: "",
      viewerId: null,
    };
  }
  const uid = (await resolveOptionalUid(req)) ?? null;
  const b = { targetUserId: uid ?? "", viewerId: uid };
  if (!uid) return { result: err(401, "Unauthorized"), ...b };

  const input = parseInput(noteBodySchema, req.body ?? {}, { in: "body" });
  if (!input.success) {
    return { result: input.result, ...b };
  }
  const { body } = input.data;
  const exists = await songNotesRepo.noteExists(noteId);
  if (!exists) return { result: err(404, "Note not found"), ...b };
  const updated = await songNotesRepo.updateNote(noteId, uid, body);
  if (!updated) return { result: err(403, "Forbidden"), ...b };
  return { result: ok({ id: noteId }), ...b };
}

/** DELETE /songs/[songId]/notes/[noteId] （v1 は 204） */
export async function handleDeleteSongNote(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const noteId = parseIntParam("noteId", req.query.noteId);
  if (noteId === null) {
    return {
      result: invalidParam("noteId", req.query.noteId, "Invalid noteId"),
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
