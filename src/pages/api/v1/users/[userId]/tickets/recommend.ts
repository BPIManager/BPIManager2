import { withRateLimit } from "@/middlewares/api/withRateLimit";
import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import {
  handleTicketRecommendGet,
  handleTicketRecommendPost,
} from "@/lib/subhandlers/tickets";
import { writeV1Result } from "@/middlewares/api/apiResult";

export default withRateLimit(
  withUserApiHandler(
    (req) => {
      const { userId } = req.query as { userId: string };
      return { userId };
    },
    async (req, res, _query, access) => {
      if (req.method === "POST") {
        const { result } = await handleTicketRecommendPost(req, access);
        return writeV1Result(res, result);
      }
      if (req.method === "GET") {
        const { result } = await handleTicketRecommendGet(req, access);
        return writeV1Result(res, result);
      }
      return res.status(405).end();
    },
  ),
  { windowMs: 60_000, max: 30, name: "tickets-recommend" },
);
