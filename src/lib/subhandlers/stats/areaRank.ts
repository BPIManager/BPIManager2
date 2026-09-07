import { usersRepo } from "@/lib/db/domains/users";
import { getUserAreaRank } from "@/lib/arena/prefectureRankings";
import { err, ok } from "@/middlewares/api/apiResult";
import type { HandlerResult } from "@/types/api";

export async function handleStatsAreaRank(q: {
  userId: string;
}): Promise<HandlerResult<unknown>> {
  const user = await usersRepo.getIidxId(q.userId);
  if (!user) return err(404, "User not found");
  return ok(getUserAreaRank(user.iidxId) ?? null);
}

/** GET stats/arenaHistory */
