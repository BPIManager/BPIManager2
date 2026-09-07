import type { NextApiRequest } from "next";
import crypto from "crypto";
import { apiKeysRepo } from "@/lib/db/domains/apiKeys";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { authUidOf, type HandleOutcome } from "./_shared";

/* ------------------------------ apiKey.ts ------------------------------ */

/** GET /apiKey */
export async function handleGetApiKey(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const uid = authUidOf(req);
  try {
    const record = await apiKeysRepo.findByUserId(uid);
    return {
      result: ok({
        exists: !!record,
        key: record ? `****${record.key.slice(-4)}` : null,
      }),
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

/** PUT /apiKey */
export async function handleRegenerateApiKey(
  req: NextApiRequest,
): Promise<HandleOutcome<{ key: string }>> {
  const uid = authUidOf(req);
  try {
    const newKey = crypto.randomBytes(32).toString("hex");
    await apiKeysRepo.upsert(uid, newKey);
    return { result: ok({ key: newKey }), targetUserId: uid, viewerId: uid };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId: uid,
      viewerId: uid,
    };
  }
}

/* ---------------------------- oauthClient.ts ---------------------------- */

