import type { NextApiResponse } from "next";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import {
  handleUpdateFollowList,
  handleDeleteFollowList,
} from "@/lib/subhandlers/follows";
import { writeV1Result } from "@/middlewares/api/apiResult";

async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
) {
  switch (req.method) {
    case "PATCH": {
      const { result } = await handleUpdateFollowList(req);
      return writeV1Result(res, result);
    }
    case "DELETE": {
      const { result } = await handleDeleteFollowList(req);
      return writeV1Result(res, result);
    }
    default:
      res.setHeader("Allow", ["PATCH", "DELETE"]);
      return res.status(405).json({ message: "Method Not Allowed" });
  }
}

export default withAuth(handler);
