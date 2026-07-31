import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { parseQuery } from "@/services/nextRequest/parseBody";
import { z } from "zod";
import { usersRepo } from "@/lib/db/domains/users";
import { getUserAreaRank } from "@/lib/arena/prefectureRankings";

const schema = z.object({ userId: z.string() });

export default withUserApiHandler(
  (req, res) => parseQuery(schema, req.query, res),
  async (req, res, { userId }) => {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res
        .status(405)
        .json({ message: `Method ${req.method} Not Allowed` });
    }

    const user = await usersRepo.getIidxId(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    const areaRank = getUserAreaRank(user.iidxId);
    return res.status(200).json(areaRank ?? null);
  },
);
