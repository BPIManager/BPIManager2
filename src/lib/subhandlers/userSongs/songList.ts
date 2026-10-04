import { songSearchRepo } from "@/lib/db/domains/songs/search";
import { resolveVersion } from "@/lib/subhandlers/shared";
import { ok } from "@/middlewares/api/apiResult";
import type { AccessResult } from "@/middlewares/api/withApi";
import type { IIDXVersion } from "@/types/iidx/version";
import type { NextApiRequest } from "next";
import { targetOf, type HandleOutcome } from "./_shared";

/** GET /users/[userId]/songs */
export async function handleSongList(
  req: NextApiRequest,
  access: AccessResult,
): Promise<HandleOutcome<unknown>> {
  const version = resolveVersion(req.query.version) as IIDXVersion;
  const songs = await songSearchRepo.getSongList(version);
  return {
    result: ok(songs),
    targetUserId: targetOf(req),
    viewerId: access.viewerId ?? null,
  };
}
