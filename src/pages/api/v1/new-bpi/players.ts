import type { NextApiResponse } from "next";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { handleNewBpiPlayers } from "@/lib/subhandlers/newBpiPlayers";
import { writeV1Result } from "@/middlewares/api/apiResult";

async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.status(405).end();
    return;
  }
  const { result } = await handleNewBpiPlayers(req);
  writeV1Result(res, result);
}

export default withAuth(handler);
