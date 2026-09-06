import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { parseQuery } from "@/services/nextRequest/parseBody";
import { z } from "zod";
import { handleStatsAreaRank } from "@/lib/subhandlers/stats";
import { writeV1Result } from "@/middlewares/api/apiResult";

export default withUserApiHandler(
  (req, res) => {
    return parseQuery(z.object({ userId: z.string() }), req.query, res);
  },
  async (req, res, query) => {
    writeV1Result(res, await handleStatsAreaRank(query));
  },
);
