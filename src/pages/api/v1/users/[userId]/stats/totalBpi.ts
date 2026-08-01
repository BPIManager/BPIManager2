import dayjs from "@/lib/dayjs";
import { scoreDetailRepo } from "@/lib/db/domains/scores/detail";
import { statsTablesRepo } from "@/lib/db/aggregates/stats/tables";
import { BpiCalculator } from "@/lib/bpi";
import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { totalBpiSchema } from "@/schemas/stats/totalBpi";
import { parseQuery } from "@/services/nextRequest/parseBody";
import { usersRepo } from "@/lib/db/domains/users";
import { getUserAreaRank } from "@/lib/arena/prefectureRankings";
import { latestVersion } from "@/constants/iidx/iidxVersions";

export default withUserApiHandler(
  (req, res) => parseQuery(totalBpiSchema, req.query, res),
  async (req, res, { userId, version, asOf }) => {
    switch (req.method) {
      case "GET": {
        const targetTime =
          !asOf || asOf === "latest"
            ? dayjs.tz().utc().toDate()
            : dayjs.tz(asOf).endOf("day").utc().toDate();

        const [scores, totalCount, user] = await Promise.all([
          scoreDetailRepo.getScoresWithDetails(userId, version, {
            targetTime,
            onlyLastPlayedInRange: { start: new Date(0), end: targetTime },
          }),
          statsTablesRepo.getTotalSongCount([12], []),
          usersRepo.getIidxId(userId),
        ]);

        const level12Scores = scores.filter(
          (s) => Number(s.difficultyLevel) === 12,
        );
        const bpis = level12Scores.map((s) =>
          s.bpi !== null && s.bpi !== undefined ? Number(s.bpi) : -15,
        );
        const totalBpi = BpiCalculator.calculateTotalBPI(bpis, totalCount);
        const estimatedRank = BpiCalculator.estimateRank(totalBpi);

        const areaRank =
          version === latestVersion
            ? getUserAreaRank(user?.iidxId ?? null)
            : null;

        return res.status(200).json({
          totalBpi,
          estimatedRank,
          playedCount: level12Scores.length,
          totalCount,
          area: areaRank?.area ?? null,
          areaRank: areaRank?.areaRank ?? null,
          totalInArea: areaRank?.totalInArea ?? null,
        });
      }
      default:
        res.setHeader("Allow", ["GET"]);
        return res
          .status(405)
          .json({ message: `Method ${req.method} Not Allowed` });
    }
  },
);
