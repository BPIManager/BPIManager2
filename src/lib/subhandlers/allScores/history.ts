import { allScoresRepo } from "@/lib/db/domains/allScores";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { accessError, err, ok } from "@/middlewares/api/apiResult";
import { checkProfileAccess } from "@/middlewares/api/withApiOnProfile";
import type { NextApiRequest } from "next";
import type { HandleOutcome, ScoreHistory } from "./_shared";

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
      return {
        result: denied,
        targetUserId,
        viewerId: access.viewerId ?? null,
      };
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
