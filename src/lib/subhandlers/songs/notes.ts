import type { NextApiRequest } from "next";
import { songNotesRepo } from "@/lib/db/domains/songNotes";
import { songNotesAggregateRepo } from "@/lib/db/aggregates/songNotes";
import { resolveOptionalUid } from "@/middlewares/api/resolveOptionalUid";
import { err, ok } from "@/middlewares/api/apiResult";
import { num, type HandleOutcome } from "./_shared";

export async function handleSongNotesList(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const songId = num(req.query.songId);
  if (songId === null) {
    return {
      result: err(400, "Invalid songId"),
      targetUserId: "",
      viewerId: null,
    };
  }
  const sort = req.query.sort === "bpi" ? "bpi" : "latest";
  const viewerId = (await resolveOptionalUid(req)) ?? null;
  const notes = await songNotesAggregateRepo.getNotes(
    songId,
    viewerId ?? undefined,
    sort,
  );
  return { result: ok(notes), targetUserId: "", viewerId };
}

/** POST /songs/[songId]/notes （v1 は 201） */
export async function handleCreateSongNote(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const songId = num(req.query.songId);
  if (songId === null) {
    return {
      result: err(400, "Invalid songId"),
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
  const id = await songNotesRepo.createNote(songId, uid, body.trim());
  return { result: ok({ id }), successStatus: 201, ...b };
}

/** PATCH /songs/[songId]/notes/[noteId] */
