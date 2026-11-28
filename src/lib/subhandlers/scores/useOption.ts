import { scoreWriteRepo } from "@/lib/db/domains/scores/write";
import { allScoresRepo } from "@/lib/db/domains/allScores";
import { scoresUseOptionBodySchema } from "@/schemas/scores/useOption";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { err, ok } from "@/middlewares/api/apiResult";
import type { AuthenticatedNextApiRequest } from "@/middlewares/api/withAuth";
import { type HandleOutcome } from "./_shared";

/**
 * 記録の使用オプションを更新する（曲詳細の履歴タブ、#708）。本人の記録だけを更新でき、他人の記録や存在しない logId は 404
 */
export async function handleScoreUseOption(req: AuthenticatedNextApiRequest): Promise<HandleOutcome<unknown>> {
  const viewerId = req.authUid;
  const base = { targetUserId: viewerId, viewerId };

  const parsed = scoresUseOptionBodySchema.safeParse(req.body);
  if (!parsed.success) return { result: err(400, parsed.error.issues[0]?.message ?? "Invalid request body"), ...base };
  const { logId, songDomain, useOption } = parsed.data;

  try {
    const repo = songDomain === "bpi" ? scoreWriteRepo : allScoresRepo;
    const updated = await repo.updateUseOption(viewerId, logId, useOption);
    if (!updated) return { result: err(404, "記録が見つかりませんでした。"), ...base };
    return { result: ok({ logId, useOption }), ...base };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), ...base };
  }
}
