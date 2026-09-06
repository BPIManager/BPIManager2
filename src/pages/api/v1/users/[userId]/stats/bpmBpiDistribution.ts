import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { parseStatsQuery } from "@/services/nextRequest/parseStatsQueries";
import { handleStatsBpmBpiDistribution } from "@/lib/subhandlers/stats";
import { writeV1Result } from "@/middlewares/api/apiResult";

export default withUserApiHandler(
  (req, res) => {
    return parseStatsQuery(req.query, res);
  },
  async (req, res, query) => {
    writeV1Result(res, await handleStatsBpmBpiDistribution(query));
  },
);
