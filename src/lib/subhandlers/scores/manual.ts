import { latestScoresRepo } from "@/lib/db/domains/scores/latest";
import { allScoresRepo } from "@/lib/db/domains/allScores";
import { songMasterRepo } from "@/lib/db/domains/songs/master";
import { allSongsRepo } from "@/lib/db/domains/allSongs";
import { saveManualScoreUpdate } from "@/lib/db/orchestrators/manualScoreUpdate";
import { userStatusLogsReadRepo } from "@/lib/db/domains/userStatusLogs/read";
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
 * 現在値の`clearState`を引き継ぐ。`missCount`は送られていればその値、なければ現在値（同じバージョンの最新の記録）を引き継ぐ。
 * 引き継いだミスカウントは、あとで同じ日・同じ EX の CSV を取り込んだときに、CSV の値で更新される（bulk.ts）
 */
function currentClearMiss(current: ImprovementCurrent | undefined, missCount?: number | null) {
  const cur = current?.missCount ?? null;
  return {
    clearState: current?.clearState ?? "NO PLAY",
    // ゲームのベストデータと同じく、少ないほうを残す
    missCount: missCount != null && cur != null ? Math.min(missCount, cur) : (missCount ?? cur),
  };
}

/** 総合BPIの、保存前・保存後・差分（プレビュー用）。差分は小数第 2 位まで。保存前の記録がなければ before・delta は null */
interface TotalBpiPreview {
  before: number | null;
  after: number | null;
  delta: number | null;
}

/**
 * 保存した場合の総合BPI（プレビュー用。保存・ロックはしない）。保存（saveManualScoreUpdate）と同じく、
 * このバージョンでこれまでに記録した最高値でラチェットする。保存前は、その記録した値（画面に出ている総合BPI）。
 * 自己ベストを上回らなければ保存されないので、保存後も保存前と同じ
 */
async function previewTotalBpi(
  userId: string,
  version: string,
  improved: boolean,
  compute: (withSaved: boolean) => number,
): Promise<TotalBpiPreview> {
  const previousBest = await userStatusLogsReadRepo.findMaxTotalBpi(userId, version);
  const fresh = (withSaved: boolean) => {
    const v = compute(withSaved);
    return Number.isFinite(v) ? v : null;
  };
  const before = previousBest ?? fresh(false);
  const after = improved ? BpiCalculator.ratchetTotalBpi(previousBest, fresh(true) ?? Number.NaN) : before;
  return {
    before,
    after,
    delta: before !== null && after !== null ? Math.round((after - before) * 100) / 100 : null,
  };
}

/** 保存する EX。ミスカウントだけが良くなった（EX は下がった）プレーでも、ベストの EX を下げない */
const bestEx = (exScore: number, current: ImprovementCurrent | undefined) => Math.max(exScore, current?.exScore ?? 0);

/**
 * 画面からのEXスコア手動入力・保存。songId は songDomain で空間を明示し、もう一方のドメインは title+difficulty で解決する。
 * CSVインポートとは別経路（saveManualScoreUpdate）で、決定的 batchId により同日の複数回保存を1レコードにまとめる。
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
  const { songId, songDomain, version, exScore, useOption, missCount, preview } = parsed.data;
  const userId = viewerId;

  try {
    const [bpiSongMaster, allLevelMaster, currentScores, currentAllScores] =
      await Promise.all([
        songMasterRepo.getSongMasterWithDef(),
        allSongsRepo.getAllLevelMaster(undefined, version),
        latestScoresRepo.getLatestScores(userId, version),
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
      { exScore, clearState: currentClearMiss(primaryCurrent).clearState, missCount },
      primaryCurrent
        ? {
            exScore: primaryCurrent.exScore,
            clearState: primaryCurrent.clearState,
            missCount: primaryCurrent.missCount,
          }
        : undefined,
    );
    // プレビューは、上回らなくても結果を返す（improved: false。総合BPIは変わらない）
    if (!improved && !preview) {
      return {
        result: err(400, "現在の自己ベストを上回っていません。"),
        ...base,
      };
    }

    // 保存する EX は、編集元の記録と比べて決め、もう一方の表にも同じ値を揃える
    const savedEx = bestEx(exScore, primaryCurrent);

    let scoreInput:
      | {
          songId: number;
          definitionId: number;
          exScore: number;
          bpi: number | null;
          clearState: string | null;
          missCount: number | null;
          useOption?: string | null;
        }
      | undefined;
    let allScoreInput:
      | {
          songId: number;
          exScore: number;
          bpi: number | null;
          clearState: string | null;
          missCount: number | null;
          useOption?: string | null;
        }
      | undefined;

    if (bpiSong) {
      const current = currentScores.find((s) => s.songId === bpiSong!.songId);
      const ex = savedEx;
      scoreInput = {
        songId: bpiSong.songId,
        definitionId: bpiSong.defId,
        exScore: ex,
        bpi: BpiCalculator.calc(ex, bpiSong),
        ...currentClearMiss(current, missCount),
        useOption: useOption ?? undefined,
      };
    }

    if (allSong) {
      const current = currentAllScores.find(
        (s) => s.songId === allSong!.songId,
      );
      const ex = savedEx;
      allScoreInput = {
        songId: allSong.songId,
        exScore: ex,
        bpi: bpiSong ? BpiCalculator.calc(ex, bpiSong) : null,
        ...currentClearMiss(current, missCount),
        useOption: useOption ?? undefined,
      };
    }

    /** スコアの一覧から総合BPIを算出する（ラチェット適用前）。withSaved なら、この譜面は保存する EX に置き換える */
    const totalBpiOf = (scores: typeof currentScores, withSaved: boolean) => {
      const twelves = bpiSongMaster.filter((s) => s.difficultyLevel === 12);
      const currentExScoreMap = new Map(
        scores.map((s) => [s.songId, s.exScore]),
      );
      const observations: IBpiScoreObservation[] = bpiSongMaster.flatMap(
        (s) => {
          const ex =
            withSaved && s.songId === bpiSong!.songId
              ? savedEx
              : currentExScoreMap.get(s.songId);
          return ex != null
            ? [{ songId: s.songId, notes: s.notes, exScore: ex }]
            : [];
        },
      );
      return BpiCalculator.calculateTotalBPI(observations, twelves);
    };

    if (preview) {
      return {
        result: ok({
          preview: true,
          songId,
          exScore: savedEx,
          bpi: scoreInput?.bpi ?? allScoreInput?.bpi ?? null,
          improved,
          totalBpi: bpiSong
            ? await previewTotalBpi(userId, version, improved, (withSaved) =>
                totalBpiOf(currentScores, withSaved),
              )
            : null,
        }),
        ...base,
      };
    }

    // 総合BPIはロック取得後の最新スコアから算出する（同時書き込みの更新分を取りこぼさない）
    const computeTotalBpi = (lockedScores: typeof currentScores) =>
      totalBpiOf(lockedScores, true);

    const { totalBpi, batchId } = await saveManualScoreUpdate({
      userId,
      version,
      score: scoreInput,
      allScore: allScoreInput,
      computeTotalBpi: scoreInput ? computeTotalBpi : undefined,
    });

    return {
      result: ok({
        songId,
        exScore: scoreInput?.exScore ?? allScoreInput?.exScore ?? exScore,
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
