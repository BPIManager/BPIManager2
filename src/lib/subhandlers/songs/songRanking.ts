import type { NextApiRequest } from "next";
import { statsTablesRepo } from "@/lib/db/aggregates/stats/tables";
import { resolveOptionalUid } from "@/middlewares/api/resolveOptionalUid";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { num, resolveVersion, type HandleOutcome } from "./_shared";
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
