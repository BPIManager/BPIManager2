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

interface ImprovementCurrent {
  exScore: number;
  clearState: string | null;
  missCount: number | null;
}

/** 現在値の`clearState`/`missCount`をそのまま引き継ぐ（手動編集はEXスコアのみ変更対象） */
function currentClearMiss(current: ImprovementCurrent | undefined) {
  return {
    clearState: current?.clearState ?? "NO PLAY",
    missCount: current?.missCount ?? null,
  };
}

/**
 * 画面上でのEXスコア手動入力・保存を扱う。
 *
 * `songId`は`songs`/`songDef`ドメイン（BPI計算対象、☆11/12）と`allSongs`
 * ドメイン（全難易度、☆1-12）のどちらかであり得るため、`songDomain`で
 * どちらの空間かを明示させ、title+difficultyでもう一方のドメインの楽曲を
 * 解決する（`updateMyScore.ts`と同じブリッジ方式）。
 *
 * CSVインポートとは別の保存経路（`saveManualScoreUpdate`）を通り、決定的
 * batchIdにより同日内の複数回の手動保存を1レコードにまとめる。
 */
export async function handleScoreManualUpdate(
  req: AuthenticatedNextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const viewerId = req.authUid;
  const base = { targetUserId: viewerId, viewerId };

  const parsed = scoresManualBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return {
      result: err(
        400,
        parsed.error.issues[0]?.message ?? "Invalid request body",
      ),
      ...base,
    };
  }
  const { songId, songDomain, version, exScore } = parsed.data;
  const userId = viewerId;

  try {
    const [bpiSongMaster, allLevelMaster, currentScores, currentAllScores] =
      await Promise.all([
        songsRepo.getSongMasterWithDef(),
        allSongsRepo.getAllLevelMaster(),
        scoresRepo.getLatestScores(userId, version),
        allScoresRepo.getLatestAllScores(userId, version),
      ]);

    let bpiSong: (typeof bpiSongMaster)[number] | undefined;
    let allSong: (typeof allLevelMaster)[number] | undefined;

    if (songDomain === "bpi") {
      bpiSong = bpiSongMaster.find((s) => s.songId === songId);
      if (bpiSong) {
        allSong = allLevelMaster.find(
          (s) =>
            s.title === bpiSong!.title && s.difficulty === bpiSong!.difficulty,
        );
      }
    } else {
      allSong = allLevelMaster.find((s) => s.songId === songId);
      if (allSong) {
        bpiSong = bpiSongMaster.find(
          (s) =>
            s.title === allSong!.title && s.difficulty === allSong!.difficulty,
        );
      }
    }

    const primarySong = songDomain === "bpi" ? bpiSong : allSong;
    if (!primarySong) {
      return { result: err(404, "楽曲が見つかりませんでした。"), ...base };
    }

    if (exScore > primarySong.notes * 2) {
      return {
        result: err(400, "EXスコアが理論上の最大値を超えています。"),
        ...base,
      };
    }

    const primaryCurrent =
      songDomain === "bpi"
        ? currentScores.find((s) => s.songId === bpiSong!.songId)
        : currentAllScores.find((s) => s.songId === allSong!.songId);

    const improved = isScoreImproved(
      { exScore, ...currentClearMiss(primaryCurrent) },
      primaryCurrent
        ? {
            exScore: primaryCurrent.exScore,
            clearState: primaryCurrent.clearState,
            missCount: primaryCurrent.missCount,
          }
        : undefined,
    );
    if (!improved) {
      return {
        result: err(400, "現在の自己ベストを上回っていません。"),
        ...base,
      };
    }

    let scoreInput:
      | {
          songId: number;
          definitionId: number;
          exScore: number;
          bpi: number | null;
          clearState: string | null;
          missCount: number | null;
        }
      | undefined;
    let allScoreInput:
      | {
          songId: number;
          exScore: number;
          bpi: number | null;
          clearState: string | null;
          missCount: number | null;
        }
      | undefined;

    if (bpiSong) {
      const current = currentScores.find((s) => s.songId === bpiSong!.songId);
      scoreInput = {
        songId: bpiSong.songId,
        definitionId: bpiSong.defId,
        exScore,
        bpi: BpiCalculator.calc(exScore, bpiSong),
        ...currentClearMiss(current),
      };
    }

    if (allSong) {
      const current = currentAllScores.find(
        (s) => s.songId === allSong!.songId,
      );
      allScoreInput = {
        songId: allSong.songId,
        exScore,
        bpi: bpiSong ? BpiCalculator.calc(exScore, bpiSong) : null,
        ...currentClearMiss(current),
      };
    }

    let newTotalBpi: number | undefined;
    if (scoreInput) {
      const twelves = bpiSongMaster.filter((s) => s.difficultyLevel === 12);
      const currentExScoreMap = new Map(
        currentScores.map((s) => [s.songId, s.exScore]),
      );
      const observations: IBpiScoreObservation[] = bpiSongMaster.flatMap(
        (s) => {
          const ex =
            s.songId === bpiSong!.songId
              ? exScore
              : currentExScoreMap.get(s.songId);
          return ex != null
            ? [{ songId: s.songId, notes: s.notes, exScore: ex }]
            : [];
        },
      );
      newTotalBpi = BpiCalculator.calculateTotalBPI(observations, twelves);
    }

    const { totalBpi, batchId } = await saveManualScoreUpdate({
      userId,
      version,
      score: scoreInput,
      allScore: allScoreInput,
      newTotalBpi,
    });

    return {
      result: ok({
        songId,
        exScore,
        bpi: scoreInput?.bpi ?? allScoreInput?.bpi ?? null,
        totalBpi,
        batchId,
        scoresSaved: !!scoreInput,
        allScoresSaved: !!allScoreInput,
      }),
      ...base,
    };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), ...base };
  }
}
