import type { NextApiRequest } from "next";
import { songSearchRepo } from "@/lib/db/domains/songs/search";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { resolveVersion, type HandleOutcome } from "./_shared";
import type { IIDXVersion } from "@/types/iidx/version";

export async function handleSongsList(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const base = { targetUserId: "", viewerId: null };
  try {
    const songs = await songSearchRepo.getSongList(
      resolveVersion(req.query.version) as IIDXVersion,
    );
    return { result: ok(songs), ...base };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), ...base };
  }
}

/** GET /songs/[songId] */
