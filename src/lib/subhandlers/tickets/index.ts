import type { NextApiRequest } from "next";
import { ticketsRepo } from "@/lib/db/aggregates/tickets";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import type { TicketRecommendResult } from "@/types/tickets";
import type { HandlerResult } from "@/types/api";
import { parseInput } from "@/lib/validation/parse";
import { ticketQuerySchema, ticketRecommendBodySchema } from "@/schemas/tickets/input";

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

  const ticketQuery = parseInput(ticketQuerySchema, req.query, {
    in: "query",
    message: "ticketId is required",
  });
  if (!ticketQuery.success) {
    return { result: ticketQuery.result, targetUserId: userId, viewerId };
  }
  const { ticketId } = ticketQuery.data;
  const expiresAt = (req.query.expiresAt as string) ?? "";
  const offset = parseInt((req.query.offset as string) ?? "0", 10);
  const scoreMode = req.query.scoreMode === "raw" ? "raw" : "relative";

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

  const input = parseInput(ticketRecommendBodySchema, req.body ?? {}, { in: "body" });
  if (!input.success) {
    return { result: input.result, targetUserId: userId, viewerId };
  }
  const { ticketIds } = input.data;
  const resolvedMode = (req.body as { scoreMode?: string }).scoreMode === "raw" ? "raw" : "relative";

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
