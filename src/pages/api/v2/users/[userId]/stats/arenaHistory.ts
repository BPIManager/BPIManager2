import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { handleStatsArenaHistory } from "@/lib/subhandlers/stats";
import {
  accessError,
  buildMeta,
  withMeta,
  writeV2Result,
  err,
} from "@/middlewares/api/apiResult";
import { parseInput } from "@/lib/validation/parse";
import { arenaHistoryRequiredSchema, arenaHistoryValueSchema } from "@/schemas/stats/routeQueries";

export default withUserApiHandler(
  (req, res) => {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      writeV2Result(res, err(405, "Method Not Allowed"));
      return null;
    }
    const required = parseInput(arenaHistoryRequiredSchema, req.query, {
      in: "query",
      message: "Missing required params: version, start, end",
    });
    if (!required.success) {
      writeV2Result(res, required.result);
      return null;
    }
    const { userId, version, start, end } = required.data;
    const values = parseInput(
      arenaHistoryValueSchema,
      { userId, version, startDate: start, endDate: end },
      { in: "query" },
    );
    if (!values.success) {
      writeV2Result(res, values.result);
      return null;
    }
    return values.data;
  },
  async (req, res, query, access) => {
    writeV2Result(
      res,
      withMeta(
        await handleStatsArenaHistory(query),
        buildMeta(access.viewerId ?? null, query.userId),
      ),
    );
  },
  { onReject: (res, access) => writeV2Result(res, accessError(access)!) },
);
