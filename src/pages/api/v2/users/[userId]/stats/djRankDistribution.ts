import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import {
  parseStatsQueryV2,
  statsQueryJsonSchema,
} from "@/services/nextRequest/parseStatsQueries";
import { handleStatsDjRankDistribution } from "@/lib/subhandlers/stats";
import {
  accessError,
  buildMeta,
  withMeta,
  writeV2Result,
  missingParams,
} from "@/middlewares/api/apiResult";

export default withUserApiHandler(
  (req, res) => {
    if (req.method !== "GET") {
      res.status(405).json({ message: "Method Not Allowed" });
      return null;
    }
    const q = parseStatsQueryV2(req.query, res);
    if (!q) return null;
    if (q.levels.length === 0 && q.difficulties.length === 0) {
      writeV2Result(
        res,
        missingParams(["level", "difficulty"], statsQueryJsonSchema(), {
          in: "query",
          hint: "level か difficulty の少なくとも一方を指定してください",
        }),
      );
      return null;
    }
    return q;
  },
  async (req, res, query, access) => {
    writeV2Result(
      res,
      withMeta(
        await handleStatsDjRankDistribution(query),
        buildMeta(access.viewerId ?? null, query.userId),
      ),
    );
  },
  { onReject: (res, access) => writeV2Result(res, accessError(access)!) },
);
