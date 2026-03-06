import type { NextApiResponse } from "next";
import {
  withAuth,
  AuthenticatedNextApiRequest,
} from "@/middlewares/api/withAuth";
import { v4 as uuidv4 } from "uuid";
import { BpiRepository } from "@/lib/db/bpi";
import { isImproved } from "@/lib/lamp";
import { BpiCalculator } from "@/lib/bpi";

const repository = new BpiRepository();

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
    const [songMaster, existingScores] = await Promise.all([
      repository.getSongMasterWithDef(),
      repository.getLatestScores(userId, version),
    ]);
    console.log(songMaster);

    const existingScoreMap = new Map(existingScores.map((s) => [s.songId, s]));
    const scoreUpdates: any[] = [];

    for (const row of csvRows) {
      const song = songMaster.find(
        (s) => s.title === row.title && s.difficulty === row.difficulty,
      );
      if (!song) continue;

      const current = existingScoreMap.get(song.songId);

      const scoreBetter = row.exScore > (current?.exScore ?? 0);
      const lampBetter = isImproved(
        row.clearState,
        current?.clearState ?? null,
      );
      const currentMiss = current?.missCount;
      const newMiss = row.missCount;

      const missBetter =
        newMiss !== null &&
        newMiss !== undefined &&
        (currentMiss === null ||
          currentMiss === undefined ||
          newMiss < currentMiss);

      if (scoreBetter || lampBetter || missBetter) {
        const bpi = BpiCalculator.calc(row.exScore, song);
        console.log(row, song, bpi);

        scoreUpdates.push({
          userId,
          songId: song.songId,
          definitionId: song.defId,
          exScore: row.exScore,
          bpi: bpi,
          clearState: row.clearState,
          missCount: row.missCount ?? null,
          lastPlayed: row.lastPlayed ? new Date(row.lastPlayed) : null,
          version,
          batchId,
        });
      }
    }

    const twelves = songMaster.filter((s) => s.difficultyLevel === 12);
    const updatedScoreMap = new Map(scoreUpdates.map((s) => [s.songId, s.bpi]));

    const allBpisForTotal = twelves.map((song) => {
      if (updatedScoreMap.has(song.songId)) {
        return updatedScoreMap.get(song.songId)!;
      }
      return existingScoreMap.get(song.songId)?.bpi ?? -15;
    });

    const newTotalBpi = BpiCalculator.calculateTotalBPI(
      allBpisForTotal,
      twelves.length,
    );

    await repository.saveImportResults({
      userId,
      version,
      batchId,
      scoreUpdates,
      newTotalBpi,
    });

    return res.status(200).json({
      success: true,
      batchId,
      updatedCount: scoreUpdates.length,
      newTotalBpi,
    });
  } catch (error: any) {
    console.error("Import Error:", error);
    return res
      .status(500)
      .json({ message: error.message || "Internal Server Error" });
  }
};

export default withAuth(handler);
