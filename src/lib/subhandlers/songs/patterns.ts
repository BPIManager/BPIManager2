import type { NextApiRequest } from "next";
import { songPatternsRepo } from "@/lib/db/domains/songPatterns";
import { resolveOptionalUid } from "@/middlewares/api/resolveOptionalUid";
import { err, ok } from "@/middlewares/api/apiResult";
import { num, type HandleOutcome } from "./_shared";
import type { VoteType } from "@/types/db";

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
