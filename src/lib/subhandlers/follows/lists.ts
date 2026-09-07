import type { NextApiRequest } from "next";
import { followListsRepo } from "@/lib/db/domains/followLists";
import { followListsAggregateRepo } from "@/lib/db/aggregates/followLists";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { createFollowListBodySchema } from "@/schemas/followLists/create";
import { updateFollowListBodySchema } from "@/schemas/followLists/update";
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

function parseListId(req: NextApiRequest): number | null {
  const { listId } = req.query;
  const id = Number(listId);
  if (!listId || Number.isNaN(id)) return null;
  return id;
}

/** PATCH /users/[userId]/follow-lists/[listId] */
export async function handleUpdateFollowList(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const uid = authUidOf(req);
  const id = parseListId(req);
  if (id === null) {
    return {
      result: err(400, "Invalid listId"),
      targetUserId: uid,
      viewerId: uid,
    };
  }
  const parsed = updateFollowListBodySchema.safeParse(req.body);
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
    const updated = await followListsRepo.update(id, uid, {
      name: parsed.data.name,
      isPublic: parsed.data.isPublic,
    });
    if (!updated) {
      return {
        result: err(404, "List not found"),
        targetUserId: uid,
        viewerId: uid,
      };
    }
    return {
      result: ok({ status: "updated" }),
      targetUserId: uid,
      viewerId: uid,
    };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId: uid,
      viewerId: uid,
    };
  }
}

/** DELETE /users/[userId]/follow-lists/[listId] */
export async function handleDeleteFollowList(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const uid = authUidOf(req);
  const id = parseListId(req);
  if (id === null) {
    return {
      result: err(400, "Invalid listId"),
      targetUserId: uid,
      viewerId: uid,
    };
  }
  try {
    const removed = await followListsRepo.remove(id, uid);
    if (!removed) {
      return {
        result: err(404, "List not found"),
        targetUserId: uid,
        viewerId: uid,
      };
    }
    return {
      result: ok({ status: "deleted" }),
      targetUserId: uid,
      viewerId: uid,
    };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId: uid,
      viewerId: uid,
    };
  }
}

/* ------------------ follow-lists/[listId]/members/[followingId] ------------------ */

/** GET /users/[userId]/follow-lists/following */
export async function handleFollowListsFollowing(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const uid = authUidOf(req);
  try {
    const following =
      await followListsAggregateRepo.getFollowingWithListMembership(uid);
    return { result: ok({ following }), targetUserId: uid, viewerId: uid };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId: uid,
      viewerId: uid,
    };
  }
}
