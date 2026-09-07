import { v4 as uuidv4 } from "uuid";
import dayjs from "@/lib/dayjs";
import { scoresRepo } from "@/lib/db/domains/scores";
import { allScoresRepo } from "@/lib/db/domains/allScores";
import { navigationRepo } from "@/lib/db/domains/logs/navigation";
import { songsRepo } from "@/lib/db/domains/songs";
import { allSongsRepo } from "@/lib/db/domains/allSongs";
import { saveImportResults } from "@/lib/db/orchestrators/bpiImport";
import { BpiCalculator } from "@/lib/bpi";
import { isScoreImproved } from "@/lib/scores/evaluateImprovement";
import { scoresBulkBodySchema } from "@/schemas/scores/bulk";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { err, ok } from "@/middlewares/api/apiResult";
import { type HandleOutcome } from "./_shared";
import type { AuthenticatedNextApiRequest } from "@/middlewares/api/withAuth";
import type { NewScore, NewAllScores } from "@/types/db";
export async function handleScoresBulk(
  req: AuthenticatedNextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const viewerId = req.authUid;
  const base = { targetUserId: viewerId, viewerId };

  const parsed = scoresBulkBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return {
      result: err(
        400,
        parsed.error.issues[0]?.message ?? "Invalid request body",
      ),
      ...base,
    };
  }

  const { version, csvRows } = parsed.data;
  const userId = viewerId;
  const batchId = uuidv4();

  try {
    const [
      bpiSongMaster,
      allLevelMaster,
      existingBpiScores,
      existingAllScores,
      lastLog,
    ] = await Promise.all([
      songsRepo.getSongMasterWithDef(),
      allSongsRepo.getAllLevelMaster(),
      scoresRepo.getLatestScores(userId, version),
      allScoresRepo.getLatestAllScores(userId, version),
      navigationRepo.getLatestTotalBpi(userId, version),
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
      if (isScoreImproved(row, current)) {
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
      if (isScoreImproved(row, current)) {
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

    await saveImportResults({
      userId,
      version,
      batchId,
      scoreUpdates,
      allScoreUpdates,
      newTotalBpi,
    });

    return {
      result: ok({
        success: true,
        batchId,
        updatedAllCount: allScoreUpdates.length,
        updatedBpiCount: scoreUpdates.length,
        previousTotalBpi,
        newTotalBpi,
        details: { notFound },
      }),
      ...base,
    };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), ...base };
  }
}

/** POST /users/[userId]/scores/transfer （本人のみ、withAuth） */
