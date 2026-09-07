import type { NextApiRequest } from "next";
import { rivalRepo } from "@/lib/db/aggregates/rivalScores/rival";
import { checkProfileAccess } from "@/middlewares/api/withApiOnProfile";
import { accessError, err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { rivalScoreDetailQuerySchema } from "@/schemas/rivals/rivalId/scores/query";
import { targetOf, type HandleOutcome } from "./_shared";

export async function handleRivalScoreDetail(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const targetUserId = targetOf(req);
  const parsed = rivalScoreDetailQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return {
      result: err(400, "Missing required parameters"),
      targetUserId,
      viewerId: null,
    };
  }
  const { userId, rivalId, songId, version } = parsed.data;

  try {
    const rivalAccess = await checkProfileAccess(req, String(rivalId));
    const viewerId = rivalAccess.viewerId ?? null;
    const denied = accessError(rivalAccess);
    if (denied) return { result: denied, targetUserId, viewerId };

    const result = await rivalRepo.getRivalComparisonScores({
      viewerId: String(userId),
      rivalId: String(rivalId),
      version,
    });
    const rivalData = result.find((r) => r.songId === Number(songId));
    if (!rivalData) {
      return {
        result: err(404, "Rival score not found"),
        targetUserId,
        viewerId,
      };
    }

    return {
      result: ok({
        songId: Number(songId),
        version: String(version),
        rival: {
          userId: rivalData.rivalUserId ?? null,
          userName: rivalData.rivalUserName ?? null,
          profileImage: null,
          exScore: rivalData.rivalExScore,
          bpi: rivalData.rivalBpi !== null ? Number(rivalData.rivalBpi) : -15.0,
          clearState: rivalData.rivalClearState,
          lastPlayed: rivalData.rivalLastPlayed,
          metadata: {
            wrScore: rivalData.wrScore,
            kaidenAvg: rivalData.kaidenAvg,
          },
        },
      }),
      targetUserId,
      viewerId,
    };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId,
      viewerId: null,
    };
  }
}
