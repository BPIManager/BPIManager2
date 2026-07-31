import type { NextApiResponse } from "next";
import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { timelineRepo } from "@/lib/db/domains/scores";
import { selfVersionComparisonQuerySchema } from "@/schemas/scores/query";
import z from "zod";
import { parseQuery } from "@/services/nextRequest/parseBody";
import topElements from "@/constants/iidx/radars/topElements";

const radarLookup = new Map<string, string>(
  (topElements as { title: string; difficulty: string; top: string }[]).map(
    (e) => [`${e.title}__${e.difficulty}`, e.top],
  ),
);

async function handleGetSelfVersion(
  res: NextApiResponse,
  query: z.infer<typeof selfVersionComparisonQuerySchema>,
) {
  const { userId, currentVersion, targetVersion } = query;

  const rows = await timelineRepo.getSelfVersionScores({
    userId,
    currentVersion,
    targetVersion,
  });

  const result = rows.map((row) => {
    const myEx =
      row.myExScore !== null && row.myExScore !== undefined
        ? Number(row.myExScore)
        : null;
    const prevEx =
      row.prevExScore !== null && row.prevExScore !== undefined
        ? Number(row.prevExScore)
        : null;
    const myBpi =
      row.myBpi !== null && row.myBpi !== undefined ? Number(row.myBpi) : null;
    const prevBpi =
      row.prevBpi !== null && row.prevBpi !== undefined
        ? Number(row.prevBpi)
        : null;

    return {
      songId: Number(row.songId),
      title: row.title,
      notes: Number(row.notes),
      bpm: row.bpm,
      difficulty: row.difficulty,
      difficultyLevel: Number(row.difficultyLevel),
      releasedVersion: row.releasedVersion ? Number(row.releasedVersion) : null,
      logId: null,
      exScore: myEx,
      bpi: myBpi,
      clearState: row.myClearState ?? null,
      missCount:
        row.myMissCount !== null && row.myMissCount !== undefined
          ? Number(row.myMissCount)
          : null,
      scoreAt: row.myLastPlayed ?? null,

      wrScore: row.wrScore !== null ? Number(row.wrScore) : null,
      kaidenAvg: row.kaidenAvg !== null ? Number(row.kaidenAvg) : null,
      coef: row.coef !== null ? Number(row.coef) : null,
      rival: {
        exScore: prevEx,
        bpi: prevBpi,
        clearState: row.prevClearState ?? null,
        missCount:
          row.prevMissCount !== null && row.prevMissCount !== undefined
            ? Number(row.prevMissCount)
            : null,
        lastPlayed: row.prevLastPlayed ?? null,
      },

      exDiff: myEx !== null && prevEx !== null ? myEx - prevEx : undefined,
      bpiDiff:
        myBpi !== null && prevBpi !== null
          ? Math.round((myBpi - prevBpi) * 100) / 100
          : undefined,
      radarTop: radarLookup.get(`${row.title}__${row.difficulty}`) ?? null,
    };
  });

  return res.status(200).json(result);
}

export default withUserApiHandler(
  (req, res) => {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      res.status(405).json({ message: `Method ${req.method} Not Allowed` });
      return null;
    }
    return parseQuery(selfVersionComparisonQuerySchema, req.query, res);
  },
  async (req, res, query) => {
    return await handleGetSelfVersion(res, query);
  },
);
