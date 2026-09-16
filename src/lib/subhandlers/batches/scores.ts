import type { NextApiRequest } from "next";
import { navigationRepo } from "@/lib/db/domains/logs/navigation";
import { checkProfileAccess } from "@/middlewares/api/withApiOnProfile";
import { accessError, err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { batchScoresQuerySchema } from "@/schemas/batches/query";
import { handleLastPlayedBase, handleCreatedAtBase } from "./_dailyScores";
import { targetOf, type HandleOutcome } from "./_shared";

export async function handleBatchScores(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const parsed = batchScoresQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return {
      result: err(
        400,
        parsed.error.issues[0]?.message ?? "Invalid query parameters",
      ),
      targetUserId: targetOf(req),
      viewerId: null,
    };
  }
  const {
    userId: uid,
    batchId: dateStr,
    version: ver,
    type,
    groupedBy,
  } = parsed.data;

  try {
    const access = await checkProfileAccess(req, uid);
    const viewerId = access.viewerId ?? null;
    const denied = accessError(access);
    if (denied) return { result: denied, targetUserId: uid, viewerId };

    const basis: "lastPlayed" | "createdAt" =
      groupedBy === "lastPlayed" ? "lastPlayed" : "createdAt";

    const range = navigationRepo.getJstRange(dateStr, type);
    const nav = await navigationRepo.getRangeNavigation(uid, ver, range, basis);

    const isOwnLog = access.viewerId === uid;

    const responseData =
      groupedBy === "lastPlayed"
        ? await handleLastPlayedBase(uid, ver, range, nav, isOwnLog, type)
        : await handleCreatedAtBase(uid, ver, range, nav, isOwnLog, type);

    return {
      result: ok({
        ...responseData,
        range: { start: range.start, end: range.end, unit: type },
      }),
      targetUserId: uid,
      viewerId,
    };
  } catch (error: unknown) {
    console.error(`Fetch Detail Error:`, error);
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId: uid,
      viewerId: null,
    };
  }
}
