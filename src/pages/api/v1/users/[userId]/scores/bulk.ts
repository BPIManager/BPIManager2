import type { NextApiResponse } from "next";
import {
  withAuth,
  AuthenticatedNextApiRequest,
} from "@/middlewares/api/withAuth";
import { v4 as uuidv4 } from "uuid";
import { isImproved } from "@/lib/lamp";
import { BpiCalculator } from "@/lib/bpi";
import { NewScore, NewAllScores } from "@/types/db";
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
    const [
      bpiSongMaster,
      allLevelMaster,
      existingBpiScores,
      existingAllScores,
      lastLog,
    ] = await Promise.all([
      bpiRepo.getSongMasterWithDef(),
      bpiRepo.getAllLevelMaster(),
      bpiRepo.getLatestScores(userId, version),
      bpiRepo.getLatestAllScores(userId, version),
      bpiRepo.getLatestTotalBpi(userId, version),
    ]);

    const bpiMasterMap = new Map(
      bpiSongMaster.map((s) => [`${s.title}_${s.difficulty}`, s]),
    );
    const allMasterMap = new Map(
      allLevelMaster.map((s) => [`${s.title}_${s.difficulty}`, s]),
    );

    const bpiScoreMap = new Map(existingBpiScores.map((s) => [s.songId, s]));
    const allScoreMap = new Map(existingAllScores.map((s) => [s.songId, s]));

    const scoreUpdates: NewScore[] = [];
    const allScoreUpdates: NewAllScores[] = [];
    const notFound: { title: string; difficulty: string }[] = [];
    const previousTotalBpi = lastLog?.totalBpi ?? -15;

    type CsvRow = {
      title: string;
      difficulty: string;
      exScore: number;
      clearState: string;
      missCount: number | null;
      lastPlayed: string | null;
    };
    type CurrentScore =
      | { exScore: number; clearState: string | null; missCount: number | null }
      | undefined;

    const checkImprovement = (row: CsvRow, current: CurrentScore) => {
      if (!row.exScore || row.exScore <= 0) return false;
      const scoreBetter = row.exScore > (current?.exScore ?? 0);
      const lampBetter = isImproved(
        row.clearState,
        current?.clearState ?? null,
      );
      const currentMiss = current?.missCount ?? Infinity;
      const missBetter = row.missCount !== null && row.missCount < currentMiss;
      return scoreBetter || lampBetter || missBetter;
    };

    const lastPlayedDate = (dateStr: string | null) =>
      dateStr && dayjs(dateStr).isValid()
        ? dayjs.tz(dateStr).utc().toDate()
        : new Date();

    //全データ
    for (const row of csvRows) {
      const song = allMasterMap.get(`${row.title}_${row.difficulty}`);

      if (!song) {
        notFound.push({ title: row.title, difficulty: row.difficulty });
        continue;
      }

      const current = allScoreMap.get(song.songId);
      if (checkImprovement(row, current)) {
        const bpiTarget = bpiMasterMap.get(`${row.title}_${row.difficulty}`);
        const bpiValue = bpiTarget
          ? BpiCalculator.calc(row.exScore, bpiTarget)
          : null;

        allScoreUpdates.push({
          userId,
          songId: song.songId,
          definitionId: null,
          exScore: row.exScore,
          bpi: bpiValue,
          clearState: row.clearState,
          missCount: row.missCount ?? null,
          lastPlayed: lastPlayedDate(row.lastPlayed),
          version,
          batchId,
        } as NewAllScores);
      }
    }

    // 11,12のみ
    for (const row of csvRows) {
      const song = bpiMasterMap.get(`${row.title}_${row.difficulty}`);
      if (!song) continue;

      const current = bpiScoreMap.get(song.songId);
      if (checkImprovement(row, current)) {
        scoreUpdates.push({
          userId,
          songId: song.songId,
          definitionId: song.defId,
          exScore: row.exScore,
          bpi: BpiCalculator.calc(row.exScore, song),
          clearState: row.clearState,
          missCount: row.missCount ?? null,
          lastPlayed: lastPlayedDate(row.lastPlayed),
          version,
          batchId,
        } as NewScore);
      }
    }

    const twelves = bpiSongMaster.filter((s) => s.difficultyLevel === 12);
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
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ message: errorMessage });
  }
};

export default withAuth(handler);
