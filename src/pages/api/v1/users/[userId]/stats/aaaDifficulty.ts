import { BpiCalculator } from "@/lib/bpi";
import { statsRepo } from "@/lib/db/stats";
import { checkUserAccess, rejectAccess } from "@/middlewares/api/withApi";
import { aaaDifficultySchema } from "@/schemas/stats/aaaDifficulty";
import { parseQuery } from "@/services/nextRequest/parseBody";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const body = parseQuery(aaaDifficultySchema, req.query, res);
  if (!body) return;

  const { userId, version, level } = body;

  try {
    const access = await checkUserAccess(req, userId);
    if (!access.hasAccess) return rejectAccess(res, access);

    const rawData = await statsRepo.getAAATableData(userId, version, level);

    const result = rawData.map((song) => {
      const maxScore = song.notes * 2;
      const aaaTarget = Math.ceil(maxScore * (8 / 9));
      const maxMinusTarget = Math.ceil(maxScore * (17 / 18));

      const songParams = {
        title: song.title,
        notes: song.notes,
        kaidenAvg: song.kaidenAvg,
        wrScore: song.wrScore,
        coef: song.coef as number,
      };

      const aaaTargetBpi = BpiCalculator.calc(aaaTarget, songParams) ?? -15;
      const maxMinusTargetBpi =
        BpiCalculator.calc(maxMinusTarget, songParams) ?? -15;
      const currentExScore = song.userExScore ?? 0;
      const currentBpi = song.userExScore
        ? BpiCalculator.calc(song.userExScore, songParams)
        : -15;

      return {
        songId: song.songId,
        title: song.title,
        difficulty: song.difficulty,
        notes: song.notes,
        releasedVersion: song.releasedVersion,
        maxScore,
        targets: {
          aaa: {
            exScore: aaaTarget,
            targetBpi: aaaTargetBpi,
            diff: currentExScore - aaaTarget,
          },
          maxMinus: {
            exScore: maxMinusTarget,
            targetBpi: maxMinusTargetBpi,
            diff: currentExScore - maxMinusTarget,
          },
        },
        user: {
          exScore: currentExScore,
          bpi: currentBpi,
          isAaa: currentExScore >= aaaTarget,
          isMaxMinus: currentExScore >= maxMinusTarget,
        },
      };
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
