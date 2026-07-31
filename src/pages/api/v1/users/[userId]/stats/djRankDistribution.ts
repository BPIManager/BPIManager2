import { RANK_TABLE } from "@/constants/iidx/rankBorders";
import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { statsTablesRepo } from "@/lib/db/aggregates/stats/tables";
import { parseStatsQuery } from "@/services/nextRequest/parseStatsQueries";

export default withUserApiHandler(
  (req, res) => {
    if (req.method !== "GET") {
      res.status(405).json({ message: "Method Not Allowed" });
      return null;
    }

    const query = parseStatsQuery(req.query, res);
    if (!query) return null;

    if (query.levels.length === 0 && query.difficulties.length === 0) {
      res.status(400).json({ message: "Required parameters are missing" });
      return null;
    }

    return query;
  },
  async (req, res, { userId, version, levels, difficulties }) => {
    const scores = await statsTablesRepo.getLatestScoresWithMusicData(
      userId,
      version,
    );

    const distribution = RANK_TABLE.map((r) => ({ label: r.label, count: 0 }));

    scores.forEach((s) => {
      if (!s.exScore || s.exScore <= 0) return;
      if (levels.length > 0 && !levels.includes(s.difficultyLevel as number))
        return;
      if (
        difficulties.length > 0 &&
        !difficulties.includes(s.difficulty as string)
      )
        return;

      const maxScore = (s.notes || 0) * 2;
      if (maxScore === 0) return;

      const rankIdx = RANK_TABLE.findLastIndex(
        (r) => s.exScore / maxScore >= r.ratio,
      );
      if (rankIdx !== -1) distribution[rankIdx].count++;
    });

    return res.status(200).json(distribution);
  },
);
