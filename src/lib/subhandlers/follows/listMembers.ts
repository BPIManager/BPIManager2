import type { NextApiRequest } from "next";
import { followsRepo } from "@/lib/db/domains/follow";
import { followListsRepo } from "@/lib/db/domains/followLists";
import { followListMembersRepo } from "@/lib/db/domains/followListMembers";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { authUidOf, type HandleOutcome } from "./_shared";

import { parseInput } from "@/lib/validation/parse";
import { pathParamsSchema } from "@/schemas/common/params";

/** PATCH /users/[userId]/follow-lists/[listId] */

/** PUT /users/[userId]/follow-lists/[listId]/members/[followingId] */
export async function handleAddListMember(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const uid = authUidOf(req);
  const path = parseInput(pathParamsSchema("listId", "followingId"), req.query, {
    in: "path",
    message: "Invalid parameters",
  });
  if (!path.success) {
    return { result: path.result, targetUserId: uid, viewerId: uid };
  }
  const { listId: id, followingId } = path.data;
  try {
    const list = await followListsRepo.getById(id);
    if (!list || list.userId !== uid) {
      return {
        result: err(404, "List not found"),
        targetUserId: uid,
        viewerId: uid,
      };
    }
    const isFollowing = await followsRepo.isFollowing(uid, followingId);
    if (!isFollowing) {
      return {
        result: err(400, "Not following this user"),
        targetUserId: uid,
        viewerId: uid,
      };
    }
    await followListMembersRepo.addMember(id, followingId);
    return {
      result: ok({ status: "added" }),
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

/** DELETE /users/[userId]/follow-lists/[listId]/members/[followingId] */
export async function handleRemoveListMember(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const uid = authUidOf(req);
  const path = parseInput(pathParamsSchema("listId", "followingId"), req.query, {
    in: "path",
    message: "Invalid parameters",
  });
  if (!path.success) {
    return { result: path.result, targetUserId: uid, viewerId: uid };
  }
  const { listId: id, followingId } = path.data;
  try {
    const list = await followListsRepo.getById(id);
    if (!list || list.userId !== uid) {
      return {
        result: err(404, "List not found"),
        targetUserId: uid,
        viewerId: uid,
      };
    }
    await followListMembersRepo.removeMember(id, followingId);
    return {
      result: ok({ status: "removed" }),
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

/* ---------------------- follow-lists/following.ts ---------------------- */
