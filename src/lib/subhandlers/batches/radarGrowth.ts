import type { NextApiRequest } from "next";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { batchRadarGrowthQuerySchema } from "@/schemas/batches/radarGrowth";
import { calculateRadar } from "@/lib/radar/calculator";
import { buildBeforeScores, buildRadarGrowthSnapshot } from "@/lib/radar/growth";
import { targetOf, type HandleOutcome } from "./_shared";
import { logRadarRepo } from "@/lib/db/domains/logs/radar";
import { ratchetRadarValues, type RadarValues } from "@/lib/radar/snapshot";
import { loadRadarGrowthContext, type PeriodBounds } from "./_radarGrowth";

/**
 * 期間の前後の、保存済みレーダー値（バッチ時点のラチェット後）を引く。
 * 期間終了時点の値が無い（未算出）場合は null を返し、呼び出し側が都度計算した値にフォールバックする。
 */
async function findStoredRadar(
  userId: string,
  version: string,
  bounds: Exclude<PeriodBounds, { kind: "played" }>,
): Promise<{ before: RadarValues | null; after: RadarValues } | null> {
  if (bounds.kind === "batch") {
    const after = await logRadarRepo.findByBatch(userId, bounds.batchId);
    if (!after) return null;
    const before = await logRadarRepo.findLatestBeforeBatch(userId, version, after.id);
    return { before: before?.values ?? null, after: after.values };
  }
  const [after, before] = await Promise.all([
    logRadarRepo.findLatestAsOf(userId, version, bounds.end, true),
    logRadarRepo.findLatestAsOf(userId, version, bounds.start, false),
  ]);
  return after ? { before: before?.values ?? null, after: after.values } : null;
}

const valuesOf = (radar: ReturnType<typeof calculateRadar>): RadarValues =>
  Object.fromEntries(
    Object.entries(radar).map(([k, v]) => [k, v.totalBpi]),
  ) as RadarValues;

const toTotals = (v: RadarValues) =>
  Object.fromEntries(Object.entries(v).map(([k, x]) => [k, { totalBpi: x }])) as Record<
    keyof RadarValues,
    { totalBpi: number }
  >;

/** GET /users/[userId]/batches/[batchId]/radar-growth */
export async function handleBatchRadarGrowth(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  try {
    const loaded = await loadRadarGrowthContext(req, batchRadarGrowthQuerySchema);
    if ("outcome" in loaded) return loaded.outcome;
    const { query, bounds, viewerId, afterScores, periodScores, master, validSongKeys } =
      loaded.context;

    const rawAfter = calculateRadar(afterScores, master, validSongKeys);
    const rawBefore = calculateRadar(
      buildBeforeScores(afterScores, periodScores),
      master,
      validSongKeys,
    );
    let beforeValues: RadarValues;
    let afterValues: RadarValues;
    if (bounds.kind === "played") {
      // プレイ日基準は取り込み日と無関係なため、前後はプレイ日時点のスコアの状態から都度計算し、
      // 期間の前後までに取り込み済み（プレイ日が以前）のバッチの保存値を下限にラチェットする
      const [floorBefore, floorAfter] = await Promise.all([
        logRadarRepo.getMaxPlayedBy(query.userId, query.version, bounds.start, false),
        logRadarRepo.getMaxPlayedBy(query.userId, query.version, bounds.end, true),
      ]);
      beforeValues = ratchetRadarValues(floorBefore, valuesOf(rawBefore));
      afterValues = ratchetRadarValues(
        ratchetRadarValues(floorAfter, beforeValues),
        valuesOf(rawAfter),
      );
    } else {
      const stored = await findStoredRadar(query.userId, query.version, bounds);
      // 保存済みの値はバッチ時点でラチェット済み。履歴の無い更新前は、都度計算した値を起点にする
      beforeValues = stored?.before ?? valuesOf(rawBefore);
      afterValues = stored
        ? ratchetRadarValues(beforeValues, stored.after)
        : valuesOf(rawAfter);
    }

    return {
      result: ok(buildRadarGrowthSnapshot(toTotals(beforeValues), toTotals(afterValues))),
      targetUserId: query.userId,
      viewerId,
    };
  } catch (error: unknown) {
    return {
      result: err(500, toErrorMessage(error)),
      targetUserId: targetOf(req),
      viewerId: null,
    };
  }
}
