import type { NextApiRequest } from "next";
import { unplayedSongsAggregateRepo } from "@/lib/db/aggregates/unplayedSongs";
import { filterSongsServerSide } from "@/utils/songs/filter";
import { sortSongs } from "@/utils/songs/sort";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { err, ok } from "@/middlewares/api/apiResult";
import { radarLookup, targetOf, type HandleOutcome } from "./_shared";
import type { AccessResult } from "@/middlewares/api/withApi";

export async function handleUnplayed(
  req: NextApiRequest,
  access: AccessResult,
): Promise<HandleOutcome<unknown>> {
  const targetUserId = targetOf(req);
  const viewerId = access.viewerId ?? null;

  const { version, ...filterParams } = req.query;
  if (!version || typeof version !== "string") {
    return {
      result: err(400, "Missing or invalid version parameter."),
      targetUserId,
      viewerId,
    };
  }

  let rows: Awaited<
    ReturnType<typeof unplayedSongsAggregateRepo.getUnplayedSongs>
  >;
  try {
    rows = await unplayedSongsAggregateRepo.getUnplayedSongs(
      targetUserId,
      version,
    );
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), targetUserId, viewerId };
  }

  const songs = rows.map((row) => ({
    songId: Number(row.songId),
    title: row.title,
    notes: Number(row.notes || 0),
    bpm: row.bpm,
    difficulty: row.difficulty,
    difficultyLevel: Number(row.difficultyLevel),
    releasedVersion: row.releasedVersion ? Number(row.releasedVersion) : null,
    logId: null,
    exScore: null,
    bpi: null,
    clearState: null,
    missCount: null,
    scoreAt: null,
    wrScore: row.wrScore !== null ? Number(row.wrScore) : null,
    kaidenAvg: row.kaidenAvg !== null ? Number(row.kaidenAvg) : null,
    coef: row.coef !== null ? Number(row.coef) : null,
    radarTop: radarLookup.get(`${row.title}__${row.difficulty}`) ?? null,
  }));

  const processed = sortSongs(
    filterSongsServerSide(songs, filterParams),
    filterParams,
  );

  return { result: ok(processed), targetUserId, viewerId };
}

/** POST /users/[userId]/scores/bulk （本人のみ、withAuth） */
