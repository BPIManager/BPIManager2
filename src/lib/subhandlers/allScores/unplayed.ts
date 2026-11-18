import type { NextApiRequest } from "next";
import { radarTopOf } from "@/constants/iidx/radars/topElements";
import { allScoresUnplayedRepo } from "@/lib/db/aggregates/allScores/unplayed";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { accessError, err, ok } from "@/middlewares/api/apiResult";
import { checkProfileAccess } from "@/middlewares/api/withApiOnProfile";
import type { AllDifficulties } from "@/types/songs/allSongs";
import type { SongWithScore } from "@/types/songs/score";
import type { HandleOutcome } from "./_shared";
import { invalidParam } from "@/lib/validation/params";
import { parseInput } from "@/lib/validation/parse";
import { versionQuerySchema } from "@/schemas/common/query";

export async function handleAllScoresUnplayed(
  req: NextApiRequest,
): Promise<HandleOutcome<SongWithScore[]>> {
  const { userId } = req.query;
  const targetUserId = typeof userId === "string" ? userId : "";

  if (!targetUserId) {
    return { result: invalidParam("userId", req.query.userId, "Invalid userId"), targetUserId, viewerId: null };
  }
  const q = parseInput(versionQuerySchema, req.query, {
    in: "query",
    message: "Missing or invalid version parameter.",
  });
  if (!q.success) {
    return { result: q.result, targetUserId, viewerId: null };
  }
  const { version } = q.data;

  try {
    const access = await checkProfileAccess(req, targetUserId);
    const denied = accessError(access);
    const viewerId = access.viewerId ?? null;
    if (denied) return { result: denied, targetUserId, viewerId };

    const rows = await allScoresUnplayedRepo.getUnplayedAllSongs(
      targetUserId,
      version,
    );
    const songs: SongWithScore[] = rows.map((r) => ({
      songId: r.songId,
      title: r.title,
      notes: r.notes,
      bpm: r.bpm ?? null,
      difficulty: r.difficulty as AllDifficulties,
      difficultyLevel: r.difficultyLevel,
      releasedVersion: r.releasedVersion ? Number(r.releasedVersion) : null,
      logId: null,
      exScore: null,
      clearState: null,
      missCount: null,
      scoreAt: null,
      kaidenAvg: null,
      wrScore: null,
      radarTop: radarTopOf(r.title, r.difficulty),
    }));

    return { result: ok(songs), targetUserId, viewerId };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId,
      viewerId: null,
    };
  }
}
