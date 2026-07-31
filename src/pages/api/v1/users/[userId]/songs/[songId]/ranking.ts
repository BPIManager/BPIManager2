import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { statsTablesRepo } from "@/lib/db/aggregates/stats/tables";
import { latestVersion, IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";

export default withUserApiHandler(
  (req, res) => {
    if (req.method !== "GET") {
      res.status(405).end();
      return null;
    }
    const { userId } = req.query;
    return { userId: userId as string };
  },
  async (req, res, _query, access) => {
    const { songId } = req.query;
    const songIdNum = parseInt(String(songId), 10);
    if (isNaN(songIdNum))
      return res.status(400).json({ message: "Invalid songId" });

    const rawVersion = String(req.query.version ?? "");
    const version = (IIDX_VERSIONS as readonly string[]).includes(rawVersion)
      ? rawVersion
      : latestVersion;

    const result = await statsTablesRepo.getSongRanking(
      songIdNum,
      version,
      access.user!.userId,
    );
    return res.status(200).json(result);
  },
);
