import type { NextApiRequest } from "next";
import { songPatternsRepo } from "@/lib/db/domains/songPatterns";
import { resolveOptionalUid } from "@/middlewares/api/resolveOptionalUid";
import { err, ok } from "@/middlewares/api/apiResult";
import { num, type HandleOutcome } from "./_shared";
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
