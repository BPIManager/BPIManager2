import { BpiCalculator } from "@/lib/bpi";
import { StatsRepository } from "@/lib/db/stats";
import { checkUserAccess } from "@/middlewares/api/withApi";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { userId, level, version } = req.query;

  if (!userId || !version || !level) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  try {
    const access = await checkUserAccess(req, userId as string);
    if (!access.hasAccess) {
      return res
        .status(access.error!.status)
        .json({ message: access.error!.message });
    }

    const repo = new StatsRepository();
    const rawData = await repo.getAAATableData(
      userId as string,
      version as string,
      parseInt(level as string),
    );

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
      } as any;

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
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
