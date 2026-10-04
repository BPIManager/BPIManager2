import { resolveVersion } from "@/lib/subhandlers/shared";
import { err, ok } from "@/middlewares/api/apiResult";
import type { HandlerResult } from "@/types/api";
import type { NextApiRequest } from "next";
import { readJsonFile } from "./_shared";

/** GET /site/arena/official */
export async function handleOfficialArena(
  req: NextApiRequest,
): Promise<HandlerResult<unknown>> {
  const version = resolveVersion(req.query.version);
  try {
    return ok(
      await readJsonFile(
        `public/data/info/arena_official/${version}/latest.json`,
      ),
    );
  } catch {
    return err(503, "Official arena data is not yet available.");
  }
}
