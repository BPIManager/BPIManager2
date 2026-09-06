import type { NextApiResponse } from "next";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { handleUsernameAvailability } from "@/lib/subhandlers/auth";
import { writeV1Result } from "@/middlewares/api/apiResult";

async function handler(req: AuthenticatedNextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res
      .status(405)
      .json({ message: `Method ${req.method} Not Allowed` });
  }
  const { result } = await handleUsernameAvailability(req);
  writeV1Result(res, result);
}

export default withAuth(handler);
