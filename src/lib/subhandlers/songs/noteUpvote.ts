import type { NextApiRequest } from "next";
import { songNotesRepo } from "@/lib/db/domains/songNotes";
import { resolveOptionalUid } from "@/middlewares/api/resolveOptionalUid";
import { err, ok } from "@/middlewares/api/apiResult";
import { num, type HandleOutcome } from "./_shared";

export async function handleSongNoteUpvote(
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

  const upvoteCount =
    req.method === "POST"
      ? await songNotesRepo.addUpvote(noteId, uid)
      : await songNotesRepo.removeUpvote(noteId, uid);
  return { result: ok({ upvoteCount }), ...b };
}

/** GET /songs/notes/recent */
