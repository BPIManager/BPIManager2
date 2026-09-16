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

/**
 * 指定テーブルの現在値に対して改善判定を行い、改善していれば書き込み用の
 * 値（現在のclearState/missCountをそのまま引き継いだもの）を返す。
 * `scores`・`allScores`それぞれ独立に判定する（CSVバッチインポートと同じ方針）。
 */
function evaluateImprovement(exScore: number, current: ImprovementCurrent | undefined) {
  const clearState = current?.clearState ?? "NO PLAY";
  const missCount = current?.missCount ?? null;
  const improved = isScoreImproved(
    { exScore, clearState, missCount },
    current ? { exScore: current.exScore, clearState: current.clearState, missCount: current.missCount } : undefined,
  );
  return { improved, clearState, missCount };
}

/**
 * 画面上でのEXスコア手動入力・保存を扱う。
 *
 * `songId`は`songs`/`songDef`ドメイン（BPI計算対象、☆11/12）と`allSongs`
 * ドメイン（全難易度、☆1-12）のどちらかであり得るため、`songDomain`で
 * どちらの空間かを明示させ、title+difficultyでもう一方のドメインの楽曲を
 * 解決する（`updateMyScore.ts`と同じブリッジ方式）。両ドメインに存在する
 * 楽曲（☆11/12）は`scores`・`allScores`双方への書き込みを試みる
 * （それぞれ独立に改善判定）。
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
      result: err(400, parsed.error.issues[0]?.message ?? "Invalid request body"),
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
          (s) => s.title === bpiSong!.title && s.difficulty === bpiSong!.difficulty,
        );
      }
    } else {
      allSong = allLevelMaster.find((s) => s.songId === songId);
      if (allSong) {
        bpiSong = bpiSongMaster.find(
          (s) => s.title === allSong!.title && s.difficulty === allSong!.difficulty,
        );
      }
    }

    if (!bpiSong && !allSong) {
      return { result: err(404, "楽曲が見つかりませんでした。"), ...base };
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
      const { improved, clearState, missCount } = evaluateImprovement(exScore, current);
      if (improved) {
        scoreInput = {
          songId: bpiSong.songId,
          definitionId: bpiSong.defId,
          exScore,
          bpi: BpiCalculator.calc(exScore, bpiSong),
          clearState,
          missCount,
        };
      }
    }

    if (allSong) {
      const current = currentAllScores.find((s) => s.songId === allSong!.songId);
      const { improved, clearState, missCount } = evaluateImprovement(exScore, current);
      if (improved) {
        allScoreInput = {
          songId: allSong.songId,
          exScore,
          bpi: bpiSong ? BpiCalculator.calc(exScore, bpiSong) : null,
          clearState,
          missCount,
        };
      }
    }

    if (!scoreInput && !allScoreInput) {
      return { result: err(400, "現在の自己ベストを上回っていません。"), ...base };
    }

    let newTotalBpi: number | undefined;
    if (scoreInput) {
      const twelves = bpiSongMaster.filter((s) => s.difficultyLevel === 12);
      const currentExScoreMap = new Map(currentScores.map((s) => [s.songId, s.exScore]));
      const observations: IBpiScoreObservation[] = bpiSongMaster.flatMap((s) => {
        const ex =
          s.songId === bpiSong!.songId ? exScore : currentExScoreMap.get(s.songId);
        return ex != null ? [{ songId: s.songId, notes: s.notes, exScore: ex }] : [];
      });
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
