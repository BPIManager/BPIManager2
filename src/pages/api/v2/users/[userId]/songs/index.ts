import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { handleSongList } from "@/lib/subhandlers/userSongs";
import {
  accessError,
  buildMeta,
  withMeta,
  writeV2Result,
} from "@/middlewares/api/apiResult";

export default withUserApiHandler(
  (req, res) => {
    if (req.method !== "GET") {
      res.status(405).end();
      return null;
    }
    const { userId } = req.query;
    return { userId: userId as string };
  },
  async (req, res, _query, access) => {
    const { result, targetUserId, viewerId } = await handleSongList(req, access);
    writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
  },
  {
    onReject: (res, access) => writeV2Result(res, accessError(access)!),
  },
);
