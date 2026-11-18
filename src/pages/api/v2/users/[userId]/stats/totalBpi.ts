import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { totalBpiSchema } from "@/schemas/stats/totalBpi";
import { parseQueryV2 } from "@/services/nextRequest/parseBody";
import { handleStatsTotalBpi } from "@/lib/subhandlers/stats";
import {
  accessError,
  buildMeta,
  withMeta,
  writeV2Result,
  err,
} from "@/middlewares/api/apiResult";

export default withUserApiHandler(
  (req, res) => {
    const q = parseQueryV2(totalBpiSchema, req.query, res);
    if (!q) return null;
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      writeV2Result(res, err(405, `Method ${req.method} Not Allowed`));
      return null;
    }
    return q;
  },
  async (req, res, query, access) => {
    writeV2Result(
      res,
      withMeta(
        await handleStatsTotalBpi(query),
        buildMeta(access.viewerId ?? null, query.userId),
      ),
    );
  },
  { onReject: (res, access) => writeV2Result(res, accessError(access)!) },
);
