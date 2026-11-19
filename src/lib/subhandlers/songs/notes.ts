import type { NextApiRequest } from "next";
import { songNotesRepo } from "@/lib/db/domains/songNotes";
import { songMasterRepo } from "@/lib/db/domains/songs/master";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { songNotesAggregateRepo } from "@/lib/db/aggregates/songNotes";
import { resolveOptionalUid } from "@/middlewares/api/resolveOptionalUid";
import { err, ok } from "@/middlewares/api/apiResult";
import { type HandleOutcome } from "./_shared";
import { invalidParam, parseIntParam } from "@/lib/validation/params";
import { parseInput } from "@/lib/validation/parse";
import { noteBodySchema } from "@/schemas/songs/input";

export async function handleSongNotesList(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const songId = parseIntParam("songId", req.query.songId);
  if (songId === null) {
    return {
      result: invalidParam("songId", req.query.songId, "Invalid songId"),
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
  const songId = parseIntParam("songId", req.query.songId);
  if (songId === null) {
    return {
      result: invalidParam("songId", req.query.songId, "Invalid songId"),
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
  try {
    if (!(await songMasterRepo.getSongById(songId))) {
      return { result: err(404, "Song not found"), ...b };
    }
    const id = await songNotesRepo.createNote(songId, uid, body);
    return { result: ok({ id }), successStatus: 201, ...b };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), ...b };
  }
}

/** PATCH /songs/[songId]/notes/[noteId] */
