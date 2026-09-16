import { scoresRepo } from "@/lib/db/domains/scores";
import { allScoresRepo } from "@/lib/db/domains/allScores";
import { songsRepo } from "@/lib/db/domains/songs";
import { allSongsRepo } from "@/lib/db/domains/allSongs";
import { saveManualScoreUpdate } from "@/lib/db/orchestrators/manualScoreUpdate";
import { BpiCalculator } from "@/lib/bpi";
import { isScoreImproved } from "@/lib/scores/evaluateImprovement";
import { scoresManualBodySchema } from "@/schemas/scores/manual";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { err, ok } from "@/middlewares/api/apiResult";
import type { AuthenticatedNextApiRequest } from "@/middlewares/api/withAuth";
import type { IBpiScoreObservation } from "@/types/songs/bpi";
import { type HandleOutcome } from "./_shared";

/**
 * 画面上でのEXスコア手動入力・保存を扱う。
 *
 * CSVインポートとは別の保存経路（`saveManualScoreUpdate`）を通り、決定的
 * batchIdにより同日内の複数回の手動保存を1レコードにまとめる。既存の自己
 * ベストを上回らない入力は保存しない（`isScoreImproved`、CSV/MCPツールと
 * 同じ判定）。
 */
export async function handleScoreManualUpdate(
  req: AuthenticatedNextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const viewerId = req.authUid;
  const base = { targetUserId: viewerId, viewerId };

  const parsed = scoresManualBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return {
      result: err(400, parsed.error.issues[0]?.message ?? "Invalid request body"),
      ...base,
    };
  }
  const { songId, version, exScore } = parsed.data;
  const userId = viewerId;

  try {
    const [bpiSongMaster, allLevelMaster, currentScores, currentAllScores] =
      await Promise.all([
        songsRepo.getSongMasterWithDef(),
        allSongsRepo.getAllLevelMaster(),
        scoresRepo.getLatestScores(userId, version),
        allScoresRepo.getLatestAllScores(userId, version),
      ]);

    const song = bpiSongMaster.find((s) => s.songId === songId);
    if (!song) {
      return {
        result: err(
          404,
          "現在BPI定義のある楽曲として見つかりませんでした。",
        ),
        ...base,
      };
    }

    const current = currentScores.find((s) => s.songId === songId);
    const currentClearState = current?.clearState ?? "NO PLAY";
    const currentMissCount = current?.missCount ?? null;

    const improved = isScoreImproved(
      { exScore, clearState: currentClearState, missCount: currentMissCount },
      current
        ? {
            exScore: current.exScore,
            clearState: current.clearState,
            missCount: current.missCount,
          }
        : undefined,
    );
    if (!improved) {
      return {
        result: err(400, "現在の自己ベストを上回っていません。"),
        ...base,
      };
    }

    const bpi = BpiCalculator.calc(exScore, song);

    const allSong = allLevelMaster.find(
      (s) => s.title === song.title && s.difficulty === song.difficulty,
    );
    let allScore:
      | {
          songId: number;
          exScore: number;
          bpi: number | null;
          clearState: string | null;
          missCount: number | null;
        }
      | undefined;
    if (allSong) {
      const currentAllScore = currentAllScores.find(
        (s) => s.songId === allSong.songId,
      );
      const allImproved = isScoreImproved(
        { exScore, clearState: currentClearState, missCount: currentMissCount },
        currentAllScore
          ? {
              exScore: currentAllScore.exScore,
              clearState: currentAllScore.clearState,
              missCount: currentAllScore.missCount,
            }
          : undefined,
      );
      if (allImproved) {
        allScore = {
          songId: allSong.songId,
          exScore,
          bpi,
          clearState: currentClearState,
          missCount: currentMissCount,
        };
      }
    }

    const twelves = bpiSongMaster.filter((s) => s.difficultyLevel === 12);
    const currentExScoreMap = new Map(
      currentScores.map((s) => [s.songId, s.exScore]),
    );
    const observations: IBpiScoreObservation[] = bpiSongMaster.flatMap((s) => {
      const ex =
        s.songId === song.songId ? exScore : currentExScoreMap.get(s.songId);
      return ex != null ? [{ songId: s.songId, notes: s.notes, exScore: ex }] : [];
    });
    const newTotalBpi = BpiCalculator.calculateTotalBPI(observations, twelves);

    const { totalBpi, batchId } = await saveManualScoreUpdate({
      userId,
      version,
      score: {
        songId: song.songId,
        definitionId: song.defId,
        exScore,
        bpi,
        clearState: currentClearState,
        missCount: currentMissCount,
      },
      allScore,
      newTotalBpi,
    });

    return {
      result: ok({ songId: song.songId, exScore, bpi, totalBpi, batchId }),
      ...base,
    };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), ...base };
  }
}
