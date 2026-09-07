import type { NextApiResponse } from "next";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { handleRivalFollowingTopScores } from "@/lib/subhandlers/rivals";
import { writeV1Result } from "@/middlewares/api/apiResult";

const handler = async (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
): Promise<void> => {
  if (req.method !== "GET") {
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }
  const { result } = await handleRivalFollowingTopScores(req);
  writeV1Result(res, result);
};

export default withAuth(handler);
