import type { NextApiRequest } from "next";
import { songPatternsRepo } from "@/lib/db/domains/songPatterns";
import { resolveOptionalUid } from "@/middlewares/api/resolveOptionalUid";
import { ok } from "@/middlewares/api/apiResult";
import { type HandleOutcome } from "./_shared";
import { invalidParam, parseIntParam } from "@/lib/validation/params";
import { parseInput } from "@/lib/validation/parse";
import { patternCursorQuerySchema } from "@/schemas/songs/input";
export async function handleSongPatternsList(
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
  const cursorQuery = parseInput(patternCursorQuerySchema, req.query, {
    in: "query",
    message: "Invalid cursor",
  });
  if (!cursorQuery.success) {
    return { result: cursorQuery.result, targetUserId: "", viewerId: null };
  }
  const { cursor } = cursorQuery.data;
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
