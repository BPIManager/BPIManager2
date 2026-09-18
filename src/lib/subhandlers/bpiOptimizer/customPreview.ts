import type { NextApiRequest } from "next";
import { bpiOptimizerAggregateRepo } from "@/lib/db/aggregates/bpiOptimizer";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { topElementMap } from "@/constants/iidx/radars/topElements";
import { BpiCalculator } from "@/lib/bpi";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { customGoalPreviewBodySchema } from "@/schemas/optimizeMemo/customPreview";
import { targetOf, type HandleOutcome } from "./_shared";
import type {
  IBpiBasicSongData,
  IBpiScoreObservation,
} from "@/types/songs/bpi";
import type { OptimizationResult, OptimizationStep } from "@/types/bpi-optimizer";

/**
 * POST /users/[userId]/analytics/bpi-optimizer/custom-preview （withUserApiHandler）
 *
 * ユーザーが自分で選んだ曲＋目標EXスコアの組から、アルゴリズム生成プランと
 * 同じ`OptimizationResult`形状の結果（各曲のfromBpi/toBpiと、適用前後の
 * 総合BPI）を計算する。返り値はそのまま`optimizeMemo`への保存
 * （`kind: "custom"`）に使える。
 */
export async function handleCustomGoalPreview(
  req: NextApiRequest,
  access: { viewerId?: string },
): Promise<HandleOutcome<OptimizationResult>> {
  const userId = targetOf(req);
  const viewerId = access.viewerId ?? null;
  const parsed = customGoalPreviewBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return {
      result: err(400, parsed.error.issues[0]?.message ?? "Invalid request body"),
      targetUserId: userId,
      viewerId,
    };
  }

  try {
    const rawRows = await bpiOptimizerAggregateRepo.getAllSongsWithUserScores(
      userId,
      latestVersion,
    );
    const rowBySongId = new Map(rawRows.map((r) => [r.songId, r]));

    // 存在しない曲（曲データ削除・データセット取得後に削除された等）は
    // リクエスト全体を失敗させず、その曲だけ無視して残りを処理する
    const validTargets = parsed.data.targets.filter((target) =>
      rowBySongId.has(target.songId),
    );

    const allSongs: (IBpiBasicSongData & { songId: number })[] = rawRows.map(
      (r) => ({
        songId: r.songId,
        notes: r.notes,
        kaidenAvg: r.kaidenAvg != null ? Number(r.kaidenAvg) : null,
        wrScore: r.wrScore != null ? Number(r.wrScore) : null,
        coef: r.coef != null ? Number(r.coef) : null,
        mu: r.mu != null ? Number(r.mu) : null,
        sigma: r.sigma != null ? Number(r.sigma) : null,
        residualVar: r.residualVar != null ? Number(r.residualVar) : null,
      }),
    );

    const observationsBefore: IBpiScoreObservation[] = rawRows
      .filter((r) => r.exScore != null)
      .map((r) => ({
        songId: r.songId,
        notes: r.notes,
        exScore: Number(r.exScore),
      }));

    const currentTotalBpi = BpiCalculator.calculateTotalBPI(
      observationsBefore,
      allSongs,
    );

    // 各曲は同時に適用されるが、「この曲1曲が総合BPIにどれだけ効くか」を
    // 見せるため、追加した順に1曲ずつ適用していった場合の総合BPIを都度
    // 再計算する（＝アルゴリズム生成プランのcumulativeTotalBpi/bpiGainと
    // 同じ定義: 単曲BPIの差分ではなく総合BPIの差分）。
    const workingScores = new Map<number, number>(
      observationsBefore.map((o) => [o.songId, o.exScore]),
    );
    let cumulativeBpi = currentTotalBpi;

    const steps: OptimizationStep[] = validTargets.map(
      (target, index) => {
        const row = rowBySongId.get(target.songId)!;
        const song: IBpiBasicSongData = {
          notes: row.notes,
          kaidenAvg: row.kaidenAvg != null ? Number(row.kaidenAvg) : null,
          wrScore: row.wrScore != null ? Number(row.wrScore) : null,
          coef: row.coef != null ? Number(row.coef) : null,
          mu: row.mu != null ? Number(row.mu) : null,
          sigma: row.sigma != null ? Number(row.sigma) : null,
          residualVar: row.residualVar != null ? Number(row.residualVar) : null,
        };
        const fromExScore = row.exScore != null ? Number(row.exScore) : null;
        const fromBpi =
          fromExScore != null ? (BpiCalculator.calc(fromExScore, song) ?? -15) : -15;
        const toBpi = BpiCalculator.calc(target.toExScore, song) ?? -15;

        workingScores.set(target.songId, target.toExScore);
        const observationsSoFar: IBpiScoreObservation[] = allSongs
          .filter((s) => workingScores.has(s.songId))
          .map((s) => ({
            songId: s.songId,
            notes: s.notes,
            exScore: workingScores.get(s.songId)!,
          }));
        const newCumulativeBpi = BpiCalculator.calculateTotalBPI(
          observationsSoFar,
          allSongs,
        );
        const bpiGain = newCumulativeBpi - cumulativeBpi;
        cumulativeBpi = newCumulativeBpi;

        return {
          rank: index + 1,
          songId: target.songId,
          title: row.title,
          difficulty: row.difficulty,
          difficultyLevel: row.difficultyLevel,
          notes: row.notes,
          fromBpi,
          toBpi,
          fromExScore,
          toExScore: target.toExScore,
          exScoreGap: target.toExScore - (fromExScore ?? 0),
          bpiGain,
          cumulativeTotalBpi: cumulativeBpi,
          isUnplayed: fromExScore == null,
          radarCategory: topElementMap.get(`${row.title}___${row.difficulty}`) ?? null,
          isRadarStrength: false,
        };
      },
    );

    const targetTotalBpi = cumulativeBpi;

    const result: OptimizationResult = {
      steps,
      currentTotalBpi,
      targetTotalBpi,
      achievable: true,
      alreadyAchieved: targetTotalBpi <= currentTotalBpi,
      totalSongCount: allSongs.length,
    };

    return { result: ok(result), targetUserId: userId, viewerId };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId: userId,
      viewerId,
    };
  }
}
