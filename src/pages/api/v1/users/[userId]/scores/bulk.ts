import type { NextApiResponse } from "next";
import {
  withAuth,
  AuthenticatedNextApiRequest,
} from "@/middlewares/api/withAuth";
import { v4 as uuidv4 } from "uuid";
import { isImproved } from "@/lib/lamp";
import { BpiCalculator } from "@/lib/bpi";
import { NewScore, NewAllScores } from "@/types/sql";
import { bpiRepo } from "@/lib/db/bpi";
import dayjs from "@/lib/dayjs";

const handler = async (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
) => {
  if (req.method !== "POST")
    return res.status(405).json({ message: "Method Not Allowed" });

  const { version, csvRows } = req.body;
  const userId = req.authUid;
  const batchId = uuidv4();

  try {
    const [songMaster, existingBpiScores, existingAllScores, lastLog] =
      await Promise.all([
        bpiRepo.getSongMasterWithDef(),
        bpiRepo.getLatestScores(userId, version),
        bpiRepo.getLatestAllScores(userId, version),
        bpiRepo.getLatestTotalBpi(userId, version),
      ]);

    const bpiScoreMap = new Map(existingBpiScores.map((s) => [s.songId, s]));
    const allScoreMap = new Map(existingAllScores.map((s) => [s.songId, s]));

    const scoreUpdates: NewScore[] = [];
    const allScoreUpdates: NewAllScores[] = [];
    const notFound: any[] = [];
    const previousTotalBpi = lastLog?.totalBpi ?? -15;

    for (const row of csvRows) {
      const song = songMaster.find(
        (s) => s.title === row.title && s.difficulty === row.difficulty,
      );
      if (!song) {
        notFound.push({ title: row.title, difficulty: row.difficulty });
        continue;
      }

      const checkImprovement = (current: any) => {
        const scoreBetter = row.exScore > (current?.exScore ?? 0);
        const lampBetter = isImproved(
          row.clearState,
          current?.clearState ?? null,
        );
        const currentMiss = current?.missCount ?? Infinity;
        const missBetter =
          row.missCount !== null && row.missCount < currentMiss;
        return scoreBetter || lampBetter || missBetter;
      };

      if (!row.exScore || row.exScore <= 0) continue;

      const lastPlayedDate =
        row.lastPlayed && dayjs(row.lastPlayed).isValid()
          ? dayjs.tz(row.lastPlayed).utc().toDate()
          : new Date();

      const baseUpdate = {
        userId,
        songId: song.songId,
        definitionId: song.defId,
        exScore: row.exScore,
        bpi: BpiCalculator.calc(row.exScore, song),
        clearState: row.clearState,
        missCount: row.missCount ?? null,
        lastPlayed: lastPlayedDate as any,
        version,
        batchId,
      };

      if (checkImprovement(allScoreMap.get(song.songId))) {
        allScoreUpdates.push({ ...baseUpdate } as NewAllScores);
      }

      if (song.difficultyLevel && song.difficultyLevel >= 11) {
        if (checkImprovement(bpiScoreMap.get(song.songId))) {
          scoreUpdates.push({ ...baseUpdate } as NewScore);
        }
      }
    }

    const twelves = songMaster.filter((s) => s.difficultyLevel === 12);
    const updatedBpiMap = new Map(scoreUpdates.map((s) => [s.songId, s.bpi]));

    const allBpisForTotal = twelves.map((song) => {
      if (updatedBpiMap.has(song.songId))
        return updatedBpiMap.get(song.songId)!;
      return bpiScoreMap.get(song.songId)?.bpi ?? -15;
    });

    const newTotalBpi = BpiCalculator.calculateTotalBPI(
      allBpisForTotal,
      twelves.length,
    );

    await bpiRepo.saveImportResults({
      userId,
      version,
      batchId,
      scoreUpdates,
      allScoreUpdates,
      newTotalBpi,
    });

    return res.status(200).json({
      success: true,
      batchId,
      updatedAllCount: allScoreUpdates.length,
      updatedBpiCount: scoreUpdates.length,
      previousTotalBpi,
      newTotalBpi,
      details: { notFound },
    });
  } catch (error: any) {
    console.error("Import Error:", error);
    return res
      .status(500)
      .json({ message: error.message || "Internal Server Error" });
  }
};

export default withAuth(handler);
