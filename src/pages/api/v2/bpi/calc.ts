import { handleBpiCalc } from "@/lib/subhandlers/site";
import { err, writeV2Result } from "@/middlewares/api/apiResult";
import { applyPublicGetCors } from "@/middlewares/api/publicCors";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (applyPublicGetCors(req, res)) return;
  if (req.method !== "GET") {
    return writeV2Result(res, err(405, "Method not allowed"));
  }
  writeV2Result(res, await handleBpiCalc(req));
}
