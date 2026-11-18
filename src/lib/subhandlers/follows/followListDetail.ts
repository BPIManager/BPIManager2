import type { NextApiRequest } from "next";
import { followListsRepo } from "@/lib/db/domains/followLists";
import { err, ok, invalidBody } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { updateFollowListBodySchema } from "@/schemas/followLists/update";
import { authUidOf, type HandleOutcome } from "./_shared";
import { invalidParam, parseIntParam } from "@/lib/validation/params";

function parseListId(req: NextApiRequest): number | null {
  return parseIntParam("listId", req.query.listId);
}

/** PATCH /users/[userId]/follow-lists/[listId] */
export async function handleUpdateFollowList(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const uid = authUidOf(req);
  const id = parseListId(req);
  if (id === null) {
    return {
      result: invalidParam("listId", req.query.listId, "Invalid listId"),
      targetUserId: uid,
      viewerId: uid,
    };
  }
  const parsed = updateFollowListBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return {
      result: invalidBody(parsed.error, updateFollowListBodySchema),
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
      result: invalidParam("listId", req.query.listId, "Invalid listId"),
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
