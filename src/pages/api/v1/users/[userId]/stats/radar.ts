import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { parseStatsQuery } from "@/services/nextRequest/parseStatsQueries";
import { handleStatsRadar } from "@/lib/subhandlers/stats";
import { writeV1Result } from "@/middlewares/api/apiResult";

export default withUserApiHandler(
  (req, res) => {
    if (req.method !== "GET") {
      res.status(405).end();
      return null;
    }
    return parseStatsQuery(req.query, res);
  },
  async (req, res, query) => {
    writeV1Result(res, await handleStatsRadar(query));
  },
);
