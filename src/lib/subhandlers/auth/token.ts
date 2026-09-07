import type { NextApiRequest } from "next";
import { apiKeysRepo } from "@/lib/db/domains/apiKeys";
import { adminAuth } from "@/lib/firebase/admin";
import { timingSafeEqual } from "@/utils/common/timingSafeEqual";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { type HandleOutcome } from "./_shared";


/** POST /token （X-API-Key → Custom Token。公開・withRateLimit） */
export async function handleTokenExchange(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const base = { targetUserId: "", viewerId: null };
  const xApiKey = req.headers["x-api-key"];
  if (!xApiKey || typeof xApiKey !== "string") {
    return { result: err(401, "API Key is required"), ...base };
  }
  try {
    const keyRecord = await apiKeysRepo.findByKey(xApiKey);
    if (!keyRecord || !timingSafeEqual(xApiKey, keyRecord.key)) {
      return { result: err(401, "Invalid API Key"), ...base };
    }
    const customToken = await adminAuth.createCustomToken(keyRecord.userId);
    return {
      result: ok({ customToken, expiresIn: 3600 }),
      ...base,
    };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), ...base };
  }
}

/* --------------------------- invite/[token].ts --------------------------- */

