import type { NextApiRequest, NextApiResponse } from "next";
import {
  handleFollowsList,
  handleFollow,
  handleUnfollow,
} from "@/lib/subhandlers/follows";
import { writeV1Result } from "@/middlewares/api/apiResult";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  switch (req.method) {
    case "GET": {
      const { result } = await handleFollowsList(req);
      return writeV1Result(res, result);
    }
    case "PUT": {
      const { result } = await handleFollow(req);
      return writeV1Result(res, result);
    }
    case "DELETE": {
      const { result } = await handleUnfollow(req);
      return writeV1Result(res, result);
    }
    default:
      res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
