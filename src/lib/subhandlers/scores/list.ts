import type { NextApiRequest } from "next";
import dayjs from "@/lib/dayjs";
import { scoreDetailRepo } from "@/lib/db/domains/scores/detail";
import { scoresRepo } from "@/lib/db/domains/scores";
import { mapToFlatSong } from "@/utils/logs/getMapFlatten";
import { filterSongsServerSide } from "@/utils/songs/filter";
import { sortSongs } from "@/utils/songs/sort";
import {
  scoresQuerySchema,
  songHistoryQuerySchema,
} from "@/schemas/scores/query";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { err, ok } from "@/middlewares/api/apiResult";
import { targetOf, type HandleOutcome } from "./_shared";
import type { AccessResult } from "@/middlewares/api/withApi";

/** GET /users/[userId]/scores */
export async function handleScoresList(
  req: NextApiRequest,
  access: AccessResult,
): Promise<HandleOutcome<unknown>> {
  const targetUserId = targetOf(req);
  const viewerId = access.viewerId ?? null;

  const parsed = scoresQuerySchema.safeParse(req.query);
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

  const { version, asOf, ...filterParams } = parsed.data;

  const time =
    !asOf || asOf === "latest"
      ? dayjs.tz().utc().toDate()
      : dayjs.tz(asOf).utc().toDate();

  try {
    const results = await scoreDetailRepo.getScoresWithDetails(
      targetUserId,
      version,
      { targetTime: time },
    );

    const songs = results.map(mapToFlatSong);
    const processed = sortSongs(
      filterSongsServerSide(songs, filterParams),
      filterParams,
    );

    return { result: ok(processed), targetUserId, viewerId };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), targetUserId, viewerId };
  }
}

/** GET /users/[userId]/scores/[songId]/history */
export async function handleScoreHistory(
  req: NextApiRequest,
  access: AccessResult,
): Promise<HandleOutcome<unknown>> {
  const targetUserId = targetOf(req);
  const viewerId = access.viewerId ?? null;

  const parsed = songHistoryQuerySchema.safeParse(req.query);
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
    const history = await scoresRepo.getHistoryForSong(
      targetUserId,
      parsed.data.songId,
    );

    const groupedHistory = history.reduce(
      (acc, record) => {
        const v = record.version || "unknown";
        if (!acc[v]) {
          acc[v] = [];
        }
        acc[v].push(record);
        return acc;
      },
      {} as Record<string, typeof history>,
    );

    return { result: ok(groupedHistory), targetUserId, viewerId };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), targetUserId, viewerId };
  }
}
