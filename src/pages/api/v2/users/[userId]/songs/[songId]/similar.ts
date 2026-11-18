import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { handleUserSongSimilar } from "@/lib/subhandlers/userSongs";
import {
  accessError,
  buildMeta,
  withMeta,
  writeV2Result,
  err,
} from "@/middlewares/api/apiResult";

export default withUserApiHandler(
  (req, res) => {
    if (req.method !== "GET") {
      writeV2Result(res, err(405, "Method Not Allowed"));
      return null;
    }
    const { userId } = req.query;
    return { userId: userId as string };
  },
  async (req, res, _query, access) => {
    const { result, targetUserId, viewerId } = await handleUserSongSimilar(req, access);
    writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
  },
  {
    onReject: (res, access) => writeV2Result(res, accessError(access)!),
  },
);
