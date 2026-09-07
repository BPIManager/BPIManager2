import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import {
  handleTicketRecommendGet,
  handleTicketRecommendPost,
} from "@/lib/subhandlers/tickets";
import {
  accessError,
  buildMeta,
  withMeta,
  writeV2Result,
} from "@/middlewares/api/apiResult";

export default withUserApiHandler(
  (req) => {
    const { userId } = req.query as { userId: string };
    return { userId };
  },
  async (req, res, _query, access) => {
    if (req.method !== "GET" && req.method !== "POST") {
      res.status(405).end();
      return;
    }
    const { result, targetUserId, viewerId } =
      req.method === "POST"
        ? await handleTicketRecommendPost(req, access)
        : await handleTicketRecommendGet(req, access);
    writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)));
  },
  {
    onReject: (res, access) => writeV2Result(res, accessError(access)!),
  },
);
