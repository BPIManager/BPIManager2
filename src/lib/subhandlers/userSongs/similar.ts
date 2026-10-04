import { songSearchRepo } from "@/lib/db/domains/songs/search";
import { resolveVersion } from "@/lib/subhandlers/shared";
import { err, ok } from "@/middlewares/api/apiResult";
import type { AccessResult } from "@/middlewares/api/withApi";
import type { IIDXVersion } from "@/types/iidx/version";
import type { NextApiRequest } from "next";
import { targetOf, type HandleOutcome } from "./_shared";

/** GET /users/[userId]/songs/[songId]/similar */
export async function handleUserSongSimilar(
  req: NextApiRequest,
  access: AccessResult,
): Promise<HandleOutcome<unknown>> {
  const targetUserId = targetOf(req);
  const viewerId = access.viewerId ?? null;

  const songIdNum = parseInt(String(req.query.songId), 10);
  if (isNaN(songIdNum)) {
    return { result: err(400, "Invalid songId"), targetUserId, viewerId };
  }

  const version = resolveVersion(req.query.version) as IIDXVersion;

  const rawLimit = parseInt(String(req.query.limit ?? "10"), 10);
  const limit = isNaN(rawLimit) || rawLimit < 1 ? 10 : Math.min(rawLimit, 50);

  const mode = req.query.mode === "global" ? "global" : "profile";

  const result = await songSearchRepo.getSimilarSongs(
    songIdNum,
    version,
    limit,
    mode,
  );
  return { result: ok(result), targetUserId, viewerId };
}
