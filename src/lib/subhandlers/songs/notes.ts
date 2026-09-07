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
export async function handleRecentSongNotes(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const PAGE_SIZE = 20;
  const sort = req.query.sort === "upvotes" ? "upvotes" : "latest";
  const page = Math.max(0, parseInt(String(req.query.page ?? "0"), 10) || 0);
  const notes = await songNotesAggregateRepo.getRecentNotes(
    sort,
    PAGE_SIZE,
    page * PAGE_SIZE,
  );
  return { result: ok(notes), targetUserId: "", viewerId: null };
}

/* ------------------------------ patterns ------------------------------ */

/** GET /songs/[songId]/patterns */
