import { handleSupporters } from "@/lib/subhandlers/site";
import { writeV2Result } from "@/middlewares/api/apiResult";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  writeV2Result(res, await handleSupporters());
}
