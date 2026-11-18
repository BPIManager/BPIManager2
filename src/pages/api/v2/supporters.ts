import { handleSupporters } from "@/lib/subhandlers/site";
import {
  writeV2Result,
  err,
} from "@/middlewares/api/apiResult";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return writeV2Result(res, err(405, "Method Not Allowed"));
  writeV2Result(res, await handleSupporters());
}
