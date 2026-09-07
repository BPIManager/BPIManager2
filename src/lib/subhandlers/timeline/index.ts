import type { NextApiRequest } from "next";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { socialTimelineRepo } from "@/lib/db/aggregates/rivalScores/feed";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { timelineQuerySchema } from "@/schemas/timeline/query";
import type { AuthenticatedNextApiRequest } from "@/middlewares/api/withAuth";
import type { HandlerResult } from "@/types/api";

export interface HandleOutcome<T> {
  result: HandlerResult<T>;
  targetUserId: string;
  viewerId: string | null;
}

/** GET /users/[userId]/timeline （withAuth） */
export async function handleTimeline(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const viewerId = (req as AuthenticatedNextApiRequest).authUid;
  const base = { targetUserId: viewerId, viewerId };

  const normalizedQuery = {
    ...req.query,
    levels: req.query["levels[]"] ?? req.query.levels,
    difficulties: req.query["difficulties[]"] ?? req.query.difficulties,
  };
  const parsed = timelineQuerySchema.safeParse(normalizedQuery);
  if (!parsed.success) {
    return {
      result: err(
        400,
        parsed.error.issues[0]?.message ?? "Invalid query parameters",
      ),
      ...base,
    };
  }
  const query = parsed.data;

  const limit = 20;
  const version = latestVersion;

  try {
    const timeline = await socialTimelineRepo.getFollowedTimeline({
      viewerId,
      version,
      limit,
      lastId: query.lastId,
      mode: query.mode,
      search: query.search,
      levels: query.levels,
      difficulties: query.difficulties?.length ? query.difficulties : undefined,
    });

    if (timeline.length === 0) {
      return { result: ok({ timeline: [], nextId: null }), ...base };
    }

    const songIds = Array.from(new Set(timeline.map((t) => Number(t.songId))));
    const viewerScores = await socialTimelineRepo.getViewerScoresForSongs(
      viewerId,
      version,
      songIds,
    );
    const viewerScoreMap = new Map(viewerScores.map((s) => [s.songId, s]));

    const result = timeline.map((entry) => {
      const myScore = viewerScoreMap.get(entry.songId);
      const oppEx = Number(entry.exScore);
      const oppBpi = Number(entry.bpi);
      const myEx = myScore ? Number(myScore.exScore) : null;
      const myBpi = myScore ? Number(myScore.bpi) : null;
      const prevEx =
        entry.prevExScore !== null ? Number(entry.prevExScore) : -1;

      const isOvertaken = !!(myEx !== null && prevEx < myEx && oppEx > myEx);

      return {
        logId: Number(entry.logId),
        userId: entry.userId,
        userName: entry.userName,
        profileImage: entry.profileImage,
        songId: Number(entry.songId),
        title: entry.title,
        difficulty: entry.difficulty,
        difficultyLevel: Number(entry.difficultyLevel),
        lastPlayed: entry.lastPlayed,
        wrScore: Number(entry.wrScore),
        kaidenAvg: Number(entry.kaidenAvg),
        isOvertaken,
        opponentScore: {
          currentEx: oppEx,
          prevEx: prevEx === -1 ? null : prevEx,
          diffEx: prevEx === -1 ? null : oppEx - prevEx,
          currentBpi: oppBpi,
          prevBpi: entry.prevBpi !== null ? Number(entry.prevBpi) : null,
          diffBpi:
            entry.prevBpi !== null ? oppBpi - Number(entry.prevBpi) : null,
        },
        viewerScore: myScore
          ? {
              exScore: myEx,
              bpi: myBpi,
              clearState: myScore.clearState,
              diffFromOpponentEx: (myEx || 0) - oppEx,
              diffFromOpponentBpi: (myBpi || 0) - oppBpi,
            }
          : null,
      };
    });

    return {
      result: ok({
        timeline: result,
        nextId:
          timeline.length === limit
            ? timeline[timeline.length - 1].lastPlayed
            : null,
      }),
      ...base,
    };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), ...base };
  }
}
