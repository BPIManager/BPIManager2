import { err, ok } from "@/middlewares/api/apiResult";
import type { HandlerResult } from "@/types/api";
import { readJsonFile } from "./_shared";

/** GET /site/stats */
export async function handleSiteStats(): Promise<HandlerResult<unknown>> {
  try {
    return ok(await readJsonFile("public/data/info/stats.json"));
  } catch {
    return err(503, "Stats data is not yet available. Please try again later.");
  }
}
