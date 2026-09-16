import type { NextApiRequest } from "next";
import { allScoresAggregateRepo } from "@/lib/db/aggregates/allScores";
import { radarLookup, targetOf } from "@/lib/subhandlers/scores/_shared";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { err, ok } from "@/middlewares/api/apiResult";
import type { AccessResult } from "@/middlewares/api/withApi";
import { allScoresSelfVersionQuerySchema } from "@/schemas/allScores/query";
import type { HandleOutcome } from "./_shared";

/** GET /users/[userId]/all-scores/self-version */
export async function handleAllScoresSelfVersion(
  req: NextApiRequest,
  access: AccessResult,
): Promise<HandleOutcome<unknown>> {
  const targetUserId = targetOf(req);
  const viewerId = access.viewerId ?? null;

  const parsed = allScoresSelfVersionQuerySchema.safeParse(req.query);
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

  try {
    const rows = await allScoresAggregateRepo.getSelfVersionScores({
      userId: targetUserId,
      targetVersion: parsed.data.targetVersion,
    });

    const result = rows.map((row) => ({
      ...row,
      radarTop: radarLookup.get(`${row.title}__${row.difficulty}`) ?? null,
    }));

    return { result: ok(result), targetUserId, viewerId };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), targetUserId, viewerId };
  }
}
