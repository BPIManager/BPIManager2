import { statsTablesRepo } from "@/lib/db/aggregates/stats/tables";
import { songsRepo } from "@/lib/db/domains/songs";
import { resolveVersion } from "@/lib/subhandlers/shared";
import { err, ok } from "@/middlewares/api/apiResult";
import type { AccessResult } from "@/middlewares/api/withApi";
import type { HandlerResult } from "@/types/api";
import type { IIDXVersion } from "@/types/iidx/version";
import type { NextApiRequest } from "next";

/**
 * user songs ドメイン（`users/[userId]/songs/**`）の subhandler 群。
 * 全エンドポイント `withUserApiHandler`。ルートは `withUserApiHandler` の
 * ラッパーを維持しつつ、handler 本体をこれに委譲する。
 */
export interface HandleOutcome<T> {
  result: HandlerResult<T>;
  targetUserId: string;
  viewerId: string | null;
}

function targetOf(req: NextApiRequest): string {
  return typeof req.query.userId === "string" ? req.query.userId : "";
}

/** GET /users/[userId]/songs */
export async function handleSongList(
  req: NextApiRequest,
  access: AccessResult,
): Promise<HandleOutcome<unknown>> {
  const version = resolveVersion(req.query.version) as IIDXVersion;
  const songs = await songsRepo.getSongList(version);
  return {
    result: ok(songs),
    targetUserId: targetOf(req),
    viewerId: access.viewerId ?? null,
  };
}

/** GET /users/[userId]/songs/[songId]/ranking */
export async function handleUserSongRanking(
  req: NextApiRequest,
  access: AccessResult,
): Promise<HandleOutcome<unknown>> {
  const targetUserId = targetOf(req);
  const viewerId = access.viewerId ?? null;

  const songIdNum = parseInt(String(req.query.songId), 10);
  if (isNaN(songIdNum)) {
    return { result: err(400, "Invalid songId"), targetUserId, viewerId };
  }

  const result = await statsTablesRepo.getSongRanking(
    songIdNum,
    resolveVersion(req.query.version),
    access.user!.userId,
  );
  return { result: ok(result), targetUserId, viewerId };
}

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

  const result = await songsRepo.getSimilarSongs(
    songIdNum,
    version,
    limit,
    mode,
  );
  return { result: ok(result), targetUserId, viewerId };
}
