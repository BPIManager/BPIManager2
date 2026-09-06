import { allScoresAggregateRepo } from "@/lib/db/aggregates/allScores";
import { allScoresRepo } from "@/lib/db/domains/allScores";
import { resolveVersion, toErrorMessage } from "@/lib/subhandlers/shared";
import { accessError, err, ok } from "@/middlewares/api/apiResult";
import type { AccessResult } from "@/middlewares/api/withApi";
import { checkProfileAccess } from "@/middlewares/api/withApiOnProfile";
import type { AuthenticatedNextApiRequest } from "@/middlewares/api/withAuth";
import type { HandlerResult } from "@/types/api";
import type { NextApiRequest } from "next";

/**
 * all-scores（全難易度スコア）ドメインのビジネスロジックを「`res` へ書き込む」
 * 形から切り離し、正規化した結果を返す形にまとめたもの。v1/v2 のルートから共有する。
 *
 * 各 `handle*` は `{ result, targetUserId, viewerId }` を返す。ルート側は
 * v1 なら `writeV1Result(res, result)`、v2 なら
 * `writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)))`。
 */
export interface HandleOutcome<T> {
  result: HandlerResult<T>;
  targetUserId: string;
  viewerId: string | null;
}

type AllScoresList = Awaited<
  ReturnType<typeof allScoresAggregateRepo.getAllScoresList>
>;
type ScoreHistory = Awaited<
  ReturnType<typeof allScoresRepo.getScoreHistory>
>;
type AllSongRanking = Awaited<
  ReturnType<typeof allScoresRepo.getAllSongRanking>
>;

interface AllSongRivalsBody {
  songId: number;
  version: string;
  rivals: {
    userId: string;
    userName: string;
    profileImage: string | null;
    exScore: number | null;
    bpi: number | null;
    clearState: string | null;
    lastPlayed: Date | null;
  }[];
}

/** GET /users/[userId]/all-scores/list */
export async function handleAllScoresList(
  req: NextApiRequest,
): Promise<HandleOutcome<AllScoresList>> {
  const { userId } = req.query;
  const targetUserId = typeof userId === "string" ? userId : "";

  if (!targetUserId) {
    return {
      result: err(400, "Invalid userId"),
      targetUserId,
      viewerId: null,
    };
  }

  try {
    const access = await checkProfileAccess(req, targetUserId);
    const denied = accessError(access);
    if (denied) {
      return { result: denied, targetUserId, viewerId: access.viewerId ?? null };
    }

    const results = await allScoresAggregateRepo.getAllScoresList(targetUserId, {
      search: req.query.search as string,
      levels: req.query.levels as string,
      difficulties: req.query.difficulties as string,
      clearStates: req.query.clearStates as string,
      sortKey: (req.query.sortKey as string) ?? "level",
      sortOrder: (req.query.sortOrder as string) ?? "desc",
    });

    return {
      result:
        results && results.length > 0
          ? ok(results)
          : err(404, "No data found"),
      targetUserId,
      viewerId: access.viewerId ?? null,
    };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId,
      viewerId: null,
    };
  }
}

/** GET /users/[userId]/all-scores/[songId]/history */
export async function handleAllScoresHistory(
  req: NextApiRequest,
): Promise<HandleOutcome<ScoreHistory>> {
  const { userId, songId } = req.query;
  const targetUserId = typeof userId === "string" ? userId : "";

  if (!userId || !songId) {
    return {
      result: err(400, "Parameters are missing."),
      targetUserId,
      viewerId: null,
    };
  }

  try {
    const access = await checkProfileAccess(req, targetUserId);
    const denied = accessError(access);
    if (denied) {
      return { result: denied, targetUserId, viewerId: access.viewerId ?? null };
    }

    const history = await allScoresRepo.getScoreHistory(
      targetUserId,
      songId as string,
    );

    return {
      result: ok(history),
      targetUserId,
      viewerId: access.viewerId ?? null,
    };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId,
      viewerId: null,
    };
  }
}

/** GET /users/[userId]/all-scores/[songId]/ranking （本人のみ、withAuth） */
export async function handleAllSongRanking(
  req: AuthenticatedNextApiRequest,
): Promise<HandleOutcome<AllSongRanking>> {
  const viewerId = req.authUid;
  const targetUserId =
    typeof req.query.userId === "string" ? req.query.userId : viewerId;
  const songIdNum = parseInt(req.query.songId as string);

  if (isNaN(songIdNum)) {
    return { result: err(400, "Invalid songId"), targetUserId, viewerId };
  }

  try {
    const result = await allScoresRepo.getAllSongRanking(
      songIdNum,
      resolveVersion(req.query.version),
      viewerId,
    );
    return { result: ok(result), targetUserId, viewerId };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), targetUserId, viewerId };
  }
}

/** GET /users/[userId]/all-scores/[songId]/rivals （withUserApiHandler） */
export async function handleAllSongRivals(
  req: NextApiRequest,
  access: AccessResult,
): Promise<HandleOutcome<AllSongRivalsBody>> {
  const targetUserId =
    typeof req.query.userId === "string" ? req.query.userId : "";
  const viewerId = access.viewerId ?? null;
  const { songId } = req.query;

  if (!targetUserId || !songId) {
    return {
      result: err(400, "Missing required parameters"),
      targetUserId,
      viewerId,
    };
  }

  const version = resolveVersion(req.query.version);
  const rivalsScores = await allScoresAggregateRepo.getRivalScoresForAllSong({
    viewerId: targetUserId,
    songId: Number(songId),
    version,
  });

  return {
    result: ok({
      songId: Number(songId),
      version,
      rivals: rivalsScores.map((r) => ({
        userId: r.userId,
        userName: r.userName,
        profileImage: r.profileImage,
        exScore: r.exScore,
        bpi: r.bpi !== null ? Number(r.bpi) : null,
        clearState: r.clearState,
        lastPlayed: r.lastPlayed,
      })),
    }),
    targetUserId,
    viewerId,
  };
}
