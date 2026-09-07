import type { NextApiRequest } from "next";
import { usersRepo } from "@/lib/db/domains/users";
import { validateUserName } from "@/utils/common/nameValidation";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { authUidOf, type HandleOutcome } from "./_shared";

export async function handleUsernameAvailability(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const uid = authUidOf(req);
  const base = { targetUserId: uid, viewerId: uid };
  const userName = String(req.query.username);

  const validation = validateUserName(userName);
  if (!validation.isValid) {
    return {
      result: ok({ available: false, message: validation.message }),
      ...base,
    };
  }
  try {
    const existingUser = await usersRepo.checkUserNameAvailability(userName);
    return {
      result: ok({
        available: !existingUser,
        message: existingUser
          ? "この名前は既に使用されています"
          : "使用可能な名前です",
      }),
      ...base,
    };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), ...base };
  }
}

/* -------------------- follow-requests (top-level) -------------------- */
