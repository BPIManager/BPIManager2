import type { NextApiResponse } from "next";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import {
  handleAddListMember,
  handleRemoveListMember,
} from "@/lib/subhandlers/follows";
import { writeV1Result } from "@/middlewares/api/apiResult";

async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
) {
  switch (req.method) {
    case "PUT": {
      const { result } = await handleAddListMember(req);
      return writeV1Result(res, result);
    }
    case "DELETE": {
      const { result } = await handleRemoveListMember(req);
      return writeV1Result(res, result);
    }
    default:
      res.setHeader("Allow", ["PUT", "DELETE"]);
      return res.status(405).json({ message: "Method Not Allowed" });
  }
}

export default withAuth(handler);
