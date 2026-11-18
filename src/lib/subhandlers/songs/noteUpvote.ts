import type { NextApiRequest } from "next";
import { songNotesRepo } from "@/lib/db/domains/songNotes";
import { resolveOptionalUid } from "@/middlewares/api/resolveOptionalUid";
import { err, ok } from "@/middlewares/api/apiResult";
import { type HandleOutcome } from "./_shared";
import { invalidParam, parseIntParam } from "@/lib/validation/params";

export async function handleSongNoteUpvote(
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

  const upvoteCount =
    req.method === "POST"
      ? await songNotesRepo.addUpvote(noteId, uid)
      : await songNotesRepo.removeUpvote(noteId, uid);
  return { result: ok({ upvoteCount }), ...b };
}

/** GET /songs/notes/recent */
