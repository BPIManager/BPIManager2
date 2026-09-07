import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { handleBpiOptimizer } from "@/lib/subhandlers/bpiOptimizer";
import { writeV1Result } from "@/middlewares/api/apiResult";

export default withUserApiHandler(
  (req, res) => {
    if (req.method !== "GET") {
      res.status(405).json({ message: "Method not allowed" });
      return null;
    }
    return { userId: String(req.query.userId) };
  },
  async (req, res, _query, access) => {
    const { result } = await handleBpiOptimizer(req, access);
    writeV1Result(res, result);
  },
);
