import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { handleGlobalRanking } from "@/lib/subhandlers/ranking";
import { writeV1Result } from "@/middlewares/api/apiResult";
import type { NextApiResponse } from "next";

async function handler(req: AuthenticatedNextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.status(405).end();
    return;
  }

  const { result } = await handleGlobalRanking(req);
  writeV1Result(res, result);
}

export default withAuth(handler);
