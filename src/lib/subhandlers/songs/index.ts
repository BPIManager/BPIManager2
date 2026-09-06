import type { NextApiRequest } from "next";
import fs from "fs/promises";
import path from "path";
import { songsRepo } from "@/lib/db/domains/songs";
import { songNotesRepo } from "@/lib/db/domains/songNotes";
import { songNotesAggregateRepo } from "@/lib/db/aggregates/songNotes";
import { songPatternsRepo } from "@/lib/db/domains/songPatterns";
import { statsTablesRepo } from "@/lib/db/aggregates/stats/tables";
import { latestVersion, IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import { resolveOptionalUid } from "@/middlewares/api/resolveOptionalUid";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import type { IIDXVersion } from "@/types/iidx/version";
import type { VoteType } from "@/types/db";
import type { HandlerResult } from "@/types/api";

/**
 * songs 全般（`/songs/**`、ユーザースコープ外）の subhandler 群。
 * 認証は `resolveOptionalUid`（任意）。`HandlerResult` を返し v1/v2 で共有する。
 */
export interface HandleOutcome<T> {
  result: HandlerResult<T>;
  targetUserId: string;
  viewerId: string | null;
  /** v1 の成功ステータス（201/204 等）を維持するため */
  successStatus?: number;
}

function num(raw: unknown): number | null {
  if (typeof raw !== "string") return null;
  const n = parseInt(raw, 10);
  return isNaN(n) ? null : n;
}
function resolveVersion(raw: unknown): string {
  const v = String(raw ?? "");
  return (IIDX_VERSIONS as readonly string[]).includes(v) ? v : latestVersion;
}

/** GET /songs */
export async function handleSongsList(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const base = { targetUserId: "", viewerId: null };
  try {
    const songs = await songsRepo.getSongList(
      resolveVersion(req.query.version) as IIDXVersion,
    );
    return { result: ok(songs), ...base };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), ...base };
  }
}

/** GET /songs/[songId] */
export async function handleSongById(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const base = { targetUserId: "", viewerId: null };
  const songIdNum = num(req.query.songId);
  if (songIdNum === null) return { result: err(400, "Invalid songId"), ...base };
  try {
    const song = await songsRepo.getSongById(songIdNum);
    if (!song) return { result: err(404, "Song not found"), ...base };
    return { result: ok(song), ...base };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), ...base };
  }
}

/** GET /songs/[songId]/arena-averages */
export async function handleSongArenaAverages(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const base = { targetUserId: "", viewerId: null };
  const { songId } = req.query;
  if (!songId || Array.isArray(songId)) {
    return { result: err(400, "songId is required"), ...base };
  }
  try {
    const song = await songsRepo.getTitleDifficultyLevel(Number(songId));
    if (!song) return { result: err(404, "Song not found"), ...base };

    const { difficultyLevel } = song;
    if (difficultyLevel !== 11 && difficultyLevel !== 12) {
      return { result: ok(null), ...base };
    }

    const filePath = path.join(
      process.cwd(),
      "public",
      "data",
      "metrics",
      "arena",
      `${latestVersion}_${difficultyLevel}.json`,
    );
    const raw = await fs.readFile(filePath, "utf-8");
    const entries: Array<{
      title: string;
      difficulty: string;
      averages: Record<
        string,
        { avgExScore: number; rate: number; count: number; avgBpi?: number }
      >;
    }> = JSON.parse(raw);

    const entry = entries.find(
      (e) => e.title === song.title && e.difficulty === song.difficulty,
    );
    if (!entry) return { result: err(404, "Not found"), ...base };
    return { result: ok(entry.averages), ...base };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), ...base };
  }
}

/** GET /songs/[songId]/definitions */
export async function handleSongDefinitions(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const base = { targetUserId: "", viewerId: null };
  const { songId } = req.query;
  if (!songId || Array.isArray(songId)) {
    return { result: err(400, "songId is required"), ...base };
  }
  try {
    const definitions = await songsRepo.getDefinitionHistory(Number(songId));
    return { result: ok(definitions), ...base };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), ...base };
  }
}

/** GET /songs/[songId]/ranking */
export async function handleSongRanking(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const songIdNum = num(req.query.songId);
  if (songIdNum === null) {
    return {
      result: err(400, "Invalid songId"),
      targetUserId: "",
      viewerId: null,
    };
  }
  const version = resolveVersion(req.query.version);
  try {
    const viewerId = (await resolveOptionalUid(req)) ?? null;
    const result = await statsTablesRepo.getSongRanking(
      songIdNum,
      version,
      viewerId ?? undefined,
    );
    return { result: ok(result), targetUserId: "", viewerId };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId: "",
      viewerId: null,
    };
  }
}

/** GET /songs/[songId]/similar */
export async function handleSongSimilar(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const base = { targetUserId: "", viewerId: null };
  const songIdNum = num(req.query.songId);
  if (songIdNum === null) return { result: err(400, "Invalid songId"), ...base };

  const version = resolveVersion(req.query.version) as IIDXVersion;
  const rawLimit = parseInt(String(req.query.limit ?? "10"), 10);
  const limit = isNaN(rawLimit) || rawLimit < 1 ? 10 : Math.min(rawLimit, 50);
  const mode = req.query.mode === "global" ? "global" : "profile";
  try {
    const result = await songsRepo.getSimilarSongs(
      songIdNum,
      version,
      limit,
      mode,
    );
    return { result: ok(result), ...base };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), ...base };
  }
}

/* ------------------------------ notes ------------------------------ */

/** GET /songs/[songId]/notes */
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
export async function handleSongPatternsList(
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
  const cursorRaw = req.query.cursor;
  const cursor =
    cursorRaw && !Array.isArray(cursorRaw) ? parseInt(cursorRaw, 10) : 0;
  if (isNaN(cursor) || cursor < 0) {
    return {
      result: err(400, "Invalid cursor"),
      targetUserId: "",
      viewerId: null,
    };
  }
  const sortByRaw = req.query.sortBy;
  const sortBy =
    sortByRaw === "upvote" || sortByRaw === "score" ? sortByRaw : "score";
  const viewerId = (await resolveOptionalUid(req)) ?? null;
  const page = await songPatternsRepo.getPatterns(
    songId,
    cursor,
    viewerId ?? undefined,
    sortBy,
  );
  return { result: ok(page), targetUserId: "", viewerId };
}

/** GET /songs/[songId]/patterns/search */
export async function handleSongPatternSearch(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const base = { targetUserId: "", viewerId: null };
  const songId = num(req.query.songId);
  if (songId === null) return { result: err(400, "Invalid songId"), ...base };

  const q = req.query.q;
  if (!q || Array.isArray(q) || !/^\d{7}$/.test(q)) {
    return { result: err(400, "Invalid pattern"), ...base };
  }
  const result = await songPatternsRepo.searchPattern(songId, q);
  if (!result) return { result: ok(null), ...base };
  return { result: ok(result), ...base };
}

/** POST|DELETE /songs/[songId]/patterns/[pattern]/vote */
export async function handleSongPatternVote(
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
  const pattern = req.query.pattern;
  if (!pattern || Array.isArray(pattern)) {
    return {
      result: err(400, "Invalid pattern"),
      targetUserId: "",
      viewerId: null,
    };
  }
  const uid = (await resolveOptionalUid(req)) ?? null;
  const b = { targetUserId: uid ?? "", viewerId: uid };
  if (!uid) return { result: err(401, "Unauthorized"), ...b };

  if (req.method === "POST") {
    const { voteType } = req.body ?? {};
    if (voteType !== "upvote" && voteType !== "downvote") {
      return {
        result: err(400, "voteType must be upvote or downvote"),
        ...b,
      };
    }
    await songPatternsRepo.vote(songId, pattern, uid, voteType as VoteType);
    return { result: ok({ ok: true }), ...b };
  }

  await songPatternsRepo.deleteVote(songId, pattern, uid);
  return { result: ok({ ok: true }), ...b };
}
