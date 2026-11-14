import type { NextApiRequest } from "next";
import type { ZodType } from "zod";
import { logRangeRepo } from "@/lib/db/domains/logs/range";
import { scoreDetailRepo } from "@/lib/db/domains/scores/detail";
import { songMasterRepo } from "@/lib/db/domains/songs/master";
import { statsSongTablesRepo } from "@/lib/db/aggregates/stats/songTables";
import { checkProfileAccess } from "@/middlewares/api/withApiOnProfile";
import { accessError, err } from "@/middlewares/api/apiResult";
import { IIDX_DIFFICULTIES } from "@/constants/iidx/bpiDifficulties";
import { buildRadarSongMaster } from "@/lib/radar/calculator";
import { targetOf, type HandleOutcome } from "./_shared";
import type { IIDXVersion } from "@/types/iidx/version";

const RADAR_LEVEL = 12;

type DetailRows = Awaited<ReturnType<typeof scoreDetailRepo.getScoresWithDetails>>;

interface RadarGrowthQuery {
  userId: string;
  batchId: string;
  version: IIDXVersion;
  type: string;
  groupedBy: string;
}

export interface RadarGrowthScore {
  songId: number;
  title: string;
  difficulty: string | null;
  exScore: number;
  bpi: number | null;
  notes: number | null;
}

export interface RadarGrowthContext<Q extends RadarGrowthQuery> {
  query: Q;
  viewerId: string | null;
  /** 期間終了時点（AFTER）のレーダー対象スコア */
  afterScores: RadarGrowthScore[];
  /** 期間内に更新されたレーダー対象スコア（更新前スコア付き） */
  periodScores: (RadarGrowthScore & { prevExScore: number | null; prevBpi: number | null })[];
  master: ReturnType<typeof buildRadarSongMaster>;
  validSongKeys: Set<string>;
}

/** 期間（バッチ/日/週/月）内に更新されたスコアと、AFTER スナップショットの上限 logId を求める */
async function loadPeriod(
  uid: string,
  ver: IIDXVersion,
  q: { batchId: string; type: string; groupedBy: string },
): Promise<{ rows: DetailRows; untilLogId?: number } | null> {
  if (q.type === "batch") {
    const batch = await logRangeRepo.findBatchById(q.batchId, uid);
    if (!batch) return null;
    const rows = await scoreDetailRepo.getScoresWithDetails(uid, ver, {
      batchIds: [q.batchId],
    });
    return { rows, untilLogId: maxLogId(rows) };
  }

  const range = logRangeRepo.getJstRange(q.batchId, q.type as "day" | "week" | "month");
  if (q.groupedBy === "lastPlayed") {
    const rows = await scoreDetailRepo.getScoresWithDetails(uid, ver, {
      onlyLastPlayedInRange: range,
    });
    return { rows };
  }
  const batches = await logRangeRepo.findBatchesInRange(uid, ver, range.start, range.end);
  if (batches.length === 0) return null;
  const rows = await scoreDetailRepo.getScoresWithDetails(uid, ver, {
    batchIds: batches.map((b) => b.batchId),
    ...(q.type === "day" ? { comparisonTime: batches[0].createdAt } : {}),
  });
  return { rows, untilLogId: maxLogId(rows) };
}

function maxLogId(rows: DetailRows): number | undefined {
  return rows.length > 0 ? Math.max(...rows.map((r) => r.logId)) : undefined;
}

const toScore = (r: DetailRows[number]): RadarGrowthScore => ({
  songId: r.songId,
  title: r.title,
  difficulty: r.difficulty,
  exScore: r.exScore,
  bpi: r.bpi,
  notes: r.notes,
});

/**
 * クエリ検証・閲覧権限の確認のうえ、更新ログのレーダー前後比較に必要なデータ（期間終了時点のスコア・期間内の更新）を読み込む。
 * 失敗時（不正クエリ・権限なし・対象なし）は返却用の outcome を返す。
 */
export async function loadRadarGrowthContext<Q extends RadarGrowthQuery>(
  req: NextApiRequest,
  schema: ZodType<Q>,
): Promise<{ outcome: HandleOutcome<unknown> } | { context: RadarGrowthContext<Q> }> {
  const parsed = schema.safeParse(req.query);
  if (!parsed.success) {
    return {
      outcome: {
        result: err(400, parsed.error.issues[0]?.message ?? "Invalid query parameters"),
        targetUserId: targetOf(req),
        viewerId: null,
      },
    };
  }
  const query = parsed.data;
  const { userId: uid, version: ver } = query;

  const access = await checkProfileAccess(req, uid);
  const viewerId = access.viewerId ?? null;
  const denied = accessError(access);
  if (denied) return { outcome: { result: denied, targetUserId: uid, viewerId } };

  const period = await loadPeriod(uid, ver, query);
  if (!period) {
    return {
      outcome: { result: err(404, "Batch not found."), targetUserId: uid, viewerId },
    };
  }

  const [snapshot, fullMaster, validSongKeys] = await Promise.all([
    scoreDetailRepo.getScoresWithDetails(uid, ver, {
      targetTime: new Date(),
      untilLogId: period.untilLogId,
    }),
    songMasterRepo.getSongMasterWithDef(),
    statsSongTablesRepo.getFilteredSongKeys(ver, [RADAR_LEVEL], [...IIDX_DIFFICULTIES]),
  ]);

  const isRadarTarget = (r: DetailRows[number]) =>
    r.difficultyLevel === RADAR_LEVEL &&
    (IIDX_DIFFICULTIES as readonly string[]).includes(r.difficulty ?? "");

  return {
    context: {
      query,
      viewerId,
      afterScores: snapshot.filter(isRadarTarget).map(toScore),
      periodScores: period.rows.filter(isRadarTarget).map((r) => ({
        ...toScore(r),
        prevExScore: r.p_exScore ?? null,
        prevBpi: r.p_bpi ?? null,
      })),
      master: buildRadarSongMaster(fullMaster),
      validSongKeys,
    },
  };
}
