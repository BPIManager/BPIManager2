import type { NextApiRequest } from "next";
import { followListsRepo } from "@/lib/db/domains/followLists";
import { followListsAggregateRepo } from "@/lib/db/aggregates/followLists";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { createFollowListBodySchema } from "@/schemas/followLists/create";
import { authUidOf, type HandleOutcome } from "./_shared";

/** GET /users/[userId]/follow-lists */
export async function handleFollowListsList(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const uid = authUidOf(req);
  try {
    const lists = await followListsAggregateRepo.getListsWithMemberCount(uid);
    return { result: ok({ lists }), targetUserId: uid, viewerId: uid };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId: uid,
      viewerId: uid,
    };
  }
}

/** POST /users/[userId]/follow-lists （成功時 v1 は 201） */
export async function handleCreateFollowList(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const uid = authUidOf(req);
  const parsed = createFollowListBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return {
      result: err(
        400,
        parsed.error.issues[0]?.message ?? "Invalid request body",
      ),
      targetUserId: uid,
      viewerId: uid,
    };
  }
  try {
    const id = await followListsRepo.create(
      uid,
      parsed.data.name,
      parsed.data.isPublic,
    );
    return { result: ok({ id }), targetUserId: uid, viewerId: uid };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId: uid,
      viewerId: uid,
    };
  }
}

/* ------------------------- follow-lists/[listId] ------------------------- */
