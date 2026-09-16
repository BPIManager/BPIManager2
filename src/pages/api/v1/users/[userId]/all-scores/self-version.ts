import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { handleAllScoresSelfVersion } from "@/lib/subhandlers/allScores";
import { writeV1Result } from "@/middlewares/api/apiResult";

export default withUserApiHandler(
  (req, res) => {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      res.status(405).json({ message: `Method ${req.method} Not Allowed` });
      return null;
    }
    const { userId } = req.query;
    if (!userId || typeof userId !== "string") {
      res.status(400).json({ message: "Invalid userId" });
      return null;
    }
    return { userId };
  },
  async (req, res, _query, access) => {
    const { result } = await handleAllScoresSelfVersion(req, access);
    writeV1Result(res, result);
  },
);
