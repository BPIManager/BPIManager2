import type { NextApiResponse } from "next";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { handleSubmitFollowRequest } from "@/lib/subhandlers/auth";
import { writeV1Result } from "@/middlewares/api/apiResult";

async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }
  const { result, successStatus } = await handleSubmitFollowRequest(req);
  writeV1Result(res, result, undefined, successStatus);
}

export default withAuth(handler);
