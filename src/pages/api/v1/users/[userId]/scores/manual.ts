import type { NextApiResponse } from "next";
import {
  withAuth,
  AuthenticatedNextApiRequest,
} from "@/middlewares/api/withAuth";
import { handleScoreManualUpdate } from "@/lib/subhandlers/scores";
import { writeV1Result } from "@/middlewares/api/apiResult";

const handler = async (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
) => {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }

  const { result } = await handleScoreManualUpdate(req);
  writeV1Result(res, result);
};

export default withAuth(handler);
