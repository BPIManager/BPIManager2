import type { NextApiRequest } from "next";
import { timelineRepo } from "@/lib/db/domains/scores/timeline";
import { unplayedSongsAggregateRepo } from "@/lib/db/aggregates/unplayedSongs";
import { filterSongsServerSide } from "@/utils/songs/filter";
import { sortSongs } from "@/utils/songs/sort";
import { selfVersionComparisonQuerySchema } from "@/schemas/scores/query";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { err, ok } from "@/middlewares/api/apiResult";
import { radarLookup, targetOf, type HandleOutcome } from "./_shared";
import type { AccessResult } from "@/middlewares/api/withApi";

/** GET /users/[userId]/scores/best-ever */
export async function handleBestEver(
  req: NextApiRequest,
  access: AccessResult,
): Promise<HandleOutcome<unknown>> {
  const targetUserId = targetOf(req);
  const viewerId = access.viewerId ?? null;

  const { currentVersion, excludeCurrent } = req.query;
  if (!currentVersion || typeof currentVersion !== "string") {
    return {
      result: err(400, "Missing or invalid currentVersion parameter."),
      targetUserId,
      viewerId,
    };
  }

  try {
    const rows = await timelineRepo.getBestEverScores({
      userId: targetUserId,
      currentVersion,
      excludeCurrent: excludeCurrent === "true",
    });

    const result = rows.map((row) => ({
      songId: Number(row.songId),
      title: row.title,
      notes: Number(row.notes),
      bpm: row.bpm,
      difficulty: row.difficulty,
      difficultyLevel: Number(row.difficultyLevel),
      releasedVersion: row.releasedVersion ? Number(row.releasedVersion) : null,
      bestExScore: row.bestExScore !== null ? Number(row.bestExScore) : null,
      bestBpi: row.bestBpi !== null ? Number(row.bestBpi) : null,
      bestVersion: row.bestVersion ?? null,
      wrScore: row.wrScore !== null ? Number(row.wrScore) : null,
      kaidenAvg: row.kaidenAvg !== null ? Number(row.kaidenAvg) : null,
      coef: row.coef !== null ? Number(row.coef) : null,
    }));

    return { result: ok(result), targetUserId, viewerId };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), targetUserId, viewerId };
  }
}

/** GET /users/[userId]/scores/self-version */
export async function handleSelfVersion(
  req: NextApiRequest,
  access: AccessResult,
): Promise<HandleOutcome<unknown>> {
  const targetUserId = targetOf(req);
  const viewerId = access.viewerId ?? null;

  const parsed = selfVersionComparisonQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return {
      result: err(
        400,
        parsed.error.issues[0]?.message ?? "Invalid query parameters",
      ),
      targetUserId,
      viewerId,
    };
  }

  const { currentVersion, targetVersion } = parsed.data;

  let rows: Awaited<ReturnType<typeof timelineRepo.getSelfVersionScores>>;
  try {
    rows = await timelineRepo.getSelfVersionScores({
      userId: targetUserId,
      currentVersion,
      targetVersion,
    });
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), targetUserId, viewerId };
  }

  const result = rows.map((row) => {
    const myEx =
      row.myExScore !== null && row.myExScore !== undefined
        ? Number(row.myExScore)
        : null;
    const prevEx =
      row.prevExScore !== null && row.prevExScore !== undefined
        ? Number(row.prevExScore)
        : null;
    const myBpi =
      row.myBpi !== null && row.myBpi !== undefined ? Number(row.myBpi) : null;
    const prevBpi =
      row.prevBpi !== null && row.prevBpi !== undefined
        ? Number(row.prevBpi)
        : null;

    return {
      songId: Number(row.songId),
      title: row.title,
      notes: Number(row.notes),
      bpm: row.bpm,
      difficulty: row.difficulty,
      difficultyLevel: Number(row.difficultyLevel),
      releasedVersion: row.releasedVersion ? Number(row.releasedVersion) : null,
      logId: null,
      exScore: myEx,
      bpi: myBpi,
      clearState: row.myClearState ?? null,
      missCount:
        row.myMissCount !== null && row.myMissCount !== undefined
          ? Number(row.myMissCount)
          : null,
      scoreAt: row.myLastPlayed ?? null,

      wrScore: row.wrScore !== null ? Number(row.wrScore) : null,
      kaidenAvg: row.kaidenAvg !== null ? Number(row.kaidenAvg) : null,
      coef: row.coef !== null ? Number(row.coef) : null,
      rival: {
        exScore: prevEx,
        bpi: prevBpi,
        clearState: row.prevClearState ?? null,
        missCount:
          row.prevMissCount !== null && row.prevMissCount !== undefined
            ? Number(row.prevMissCount)
            : null,
        lastPlayed: row.prevLastPlayed ?? null,
      },

      exDiff: myEx !== null && prevEx !== null ? myEx - prevEx : undefined,
      bpiDiff:
        myBpi !== null && prevBpi !== null
          ? Math.round((myBpi - prevBpi) * 100) / 100
          : undefined,
      radarTop: radarLookup.get(`${row.title}__${row.difficulty}`) ?? null,
    };
  });

  return { result: ok(result), targetUserId, viewerId };
}

/** GET /users/[userId]/scores/unplayed */
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
