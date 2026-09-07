import type { NextApiResponse } from "next";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import {
  handleGetApiKey,
  handleRegenerateApiKey,
} from "@/lib/subhandlers/auth";
import { writeV1Result } from "@/middlewares/api/apiResult";

async function handler(req: AuthenticatedNextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case "GET": {
      const { result } = await handleGetApiKey(req);
      return writeV1Result(res, result);
    }
    case "PUT": {
      const { result } = await handleRegenerateApiKey(req);
      return writeV1Result(res, result);
    }
    default:
      res.setHeader("Allow", ["GET", "PUT"]);
      return res
        .status(405)
        .json({ message: `Method ${req.method} Not Allowed` });
  }
}

export default withAuth(handler);
