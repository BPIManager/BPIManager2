import type { NextApiResponse } from "next";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import {
  handleRemoveFollower,
  handleApproveLegacyFollower,
} from "@/lib/subhandlers/follows";
import { writeV1Result } from "@/middlewares/api/apiResult";

async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
) {
  switch (req.method) {
    case "DELETE": {
      const { result } = await handleRemoveFollower(req);
      return writeV1Result(res, result);
    }
    case "POST": {
      const { result } = await handleApproveLegacyFollower(req);
      return writeV1Result(res, result);
    }
    default:
      res.setHeader("Allow", ["POST", "DELETE"]);
      return res.status(405).json({ message: "Method Not Allowed" });
  }
}

export default withAuth(handler);
