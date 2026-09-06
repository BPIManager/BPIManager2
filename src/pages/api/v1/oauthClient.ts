import type { NextApiResponse } from "next";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import {
  handleGetOauthClient,
  handleUpsertOauthClient,
  handleDeleteOauthClient,
} from "@/lib/subhandlers/auth";
import { writeV1Result } from "@/middlewares/api/apiResult";

async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
) {
  switch (req.method) {
    case "GET": {
      const { result } = await handleGetOauthClient(req);
      return writeV1Result(res, result);
    }
    case "PUT": {
      const { result } = await handleUpsertOauthClient(req);
      return writeV1Result(res, result);
    }
    case "DELETE": {
      const { result } = await handleDeleteOauthClient(req);
      if (result.ok) {
        res.status(204).end();
        return;
      }
      return writeV1Result(res, result);
    }
    default:
      res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
      return res
        .status(405)
        .json({ message: `Method ${req.method} Not Allowed` });
  }
}

export default withAuth(handler);
