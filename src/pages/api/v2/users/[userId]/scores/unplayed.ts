import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { handleUnplayed } from "@/lib/subhandlers/scores";
import {
  accessError,
  buildMeta,
  withMeta,
  writeV2Result,
} from "@/middlewares/api/apiResult";

export default withUserApiHandler(
  (req, res) => {
    const { userId } = req.query;
    if (!userId || typeof userId !== "string") {
      res.status(400).json({ message: "Invalid userId" });
      return null;
    }
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      res.status(405).json({ message: `Method ${req.method} Not Allowed` });
      return null;
    }
    return { userId };
  },
  async (req, res, _query, access) => {
    const { result, targetUserId, viewerId } = await handleUnplayed(req, access);
    writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
  },
  {
    onReject: (res, access) => writeV2Result(res, accessError(access)!),
  },
);
