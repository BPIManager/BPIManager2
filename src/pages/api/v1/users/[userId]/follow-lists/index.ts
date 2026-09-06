import type { NextApiResponse } from "next";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import {
  handleFollowListsList,
  handleCreateFollowList,
} from "@/lib/subhandlers/follows";
import { writeV1Result } from "@/middlewares/api/apiResult";

async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
) {
  switch (req.method) {
    case "GET": {
      const { result } = await handleFollowListsList(req);
      return writeV1Result(res, result);
    }
    case "POST": {
      const { result } = await handleCreateFollowList(req);
      return writeV1Result(res, result, undefined, 201);
    }
    default:
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).json({ message: "Method Not Allowed" });
  }
}

export default withAuth(handler);
