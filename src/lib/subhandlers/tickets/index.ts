import type { NextApiRequest } from "next";
import { ticketsRepo } from "@/lib/db/aggregates/tickets";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import type { TicketRecommendResult } from "@/types/tickets";
import type { HandlerResult } from "@/types/api";

const VERSION = latestVersion;

export interface HandleOutcome<T> {
  result: HandlerResult<T>;
  targetUserId: string;
  viewerId: string | null;
}

function targetOf(req: NextApiRequest): string {
  return typeof req.query.userId === "string" ? req.query.userId : "";
}

/** GET /users/[userId]/tickets/recommend （withUserApiHandler） */
export async function handleTicketRecommendGet(
  req: NextApiRequest,
  access: { viewerId?: string },
): Promise<HandleOutcome<unknown>> {
  const userId = targetOf(req);
  const viewerId = access.viewerId ?? null;

  const ticketId = req.query.ticketId as string;
  const expiresAt = (req.query.expiresAt as string) ?? "";
  const offset = parseInt((req.query.offset as string) ?? "0", 10);
  const scoreMode = req.query.scoreMode === "raw" ? "raw" : "relative";

  if (!ticketId) {
    return {
      result: err(400, "ticketId is required"),
      targetUserId: userId,
      viewerId,
    };
  }

  try {
    const totalBpi = await ticketsRepo.getLatestTotalBpi(userId, VERSION);
    const { items, hasMore } = await ticketsRepo.getTopSongsForTicket(
      ticketId,
      userId,
      VERSION,
      totalBpi,
      offset,
      scoreMode,
    );
    const result: TicketRecommendResult = {
      ticketId,
      expiresAt,
      items,
      hasMore,
      totalBpi,
    };
    return { result: ok(result), targetUserId: userId, viewerId };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId: userId,
      viewerId,
    };
  }
}

/** POST /users/[userId]/tickets/recommend （withUserApiHandler） */
export async function handleTicketRecommendPost(
  req: NextApiRequest,
  access: { viewerId?: string },
): Promise<HandleOutcome<unknown>> {
  const userId = targetOf(req);
  const viewerId = access.viewerId ?? null;

  const { ticketIds, scoreMode } = req.body as {
    ticketIds: { ticketId: string; expiresAt: string }[];
    scoreMode?: "relative" | "raw";
  };
  const resolvedMode = scoreMode === "raw" ? "raw" : "relative";

  if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
    return {
      result: err(400, "ticketIds is required"),
      targetUserId: userId,
      viewerId,
    };
  }
  if (ticketIds.length > 50) {
    return {
      result: err(400, "Too many ticketIds (max 50)"),
      targetUserId: userId,
      viewerId,
    };
  }

  try {
    const totalBpi = await ticketsRepo.getLatestTotalBpi(userId, VERSION);
    const results = await Promise.all(
      ticketIds.map(async ({ ticketId, expiresAt }) => {
        const { items, hasMore } = await ticketsRepo.getTopSongsForTicket(
          ticketId,
          userId,
          VERSION,
          totalBpi,
          0,
          resolvedMode,
        );
        return {
          ticketId,
          expiresAt,
          items,
          hasMore,
          totalBpi,
        } satisfies TicketRecommendResult;
      }),
    );
    return { result: ok(results), targetUserId: userId, viewerId };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId: userId,
      viewerId,
    };
  }
}
