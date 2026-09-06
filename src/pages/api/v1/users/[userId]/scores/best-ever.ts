import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { handleBestEver } from "@/lib/subhandlers/scores";
import { writeV1Result } from "@/middlewares/api/apiResult";

export default withUserApiHandler(
  (req, res) => {
    const { userId } = req.query;
    if (!userId || typeof userId !== "string") {
      res.status(400).json({ message: "Invalid userId" });
      return null;
    }
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      res.status(405).json({ message: `Method ${req.method} Not Allowed` });
      return null;
    }
    return { userId };
  },
  async (req, res, _query, access) => {
    const { result } = await handleBestEver(req, access);
    writeV1Result(res, result);
  },
);
