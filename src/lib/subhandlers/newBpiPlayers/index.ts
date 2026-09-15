import type { NextApiRequest } from "next";
import { BpiV1 } from "@bpim/bpicalc";
import { newBpiPlayersAggregateRepo } from "@/lib/db/aggregates/newBpiPlayers";
import { BpiCalculator } from "@/lib/bpi";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import type { AuthenticatedNextApiRequest } from "@/middlewares/api/withAuth";
import type { HandlerResult } from "@/types/api";

export interface HandleOutcome<T> {
  result: HandlerResult<T>;
  targetUserId: string;
  viewerId: string | null;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;
// 「現行(V1)」列用。本番のBpiCalculatorは既にV2へ切り替わっているため、
// DB保存値ではなくここで単曲BPI・総合BPIとも常にV1で計算し直す。
const v1 = new BpiV1();

/** GET /new-bpi/players （withAuth） */
export async function handleNewBpiPlayers(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const viewerId = (req as AuthenticatedNextApiRequest).authUid;
  const base = { targetUserId: viewerId, viewerId };

  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number(req.query.pageSize) || DEFAULT_PAGE_SIZE),
  );
  const version = String(req.query.version ?? latestVersion);
  const bpiMin =
    req.query.bpiMin !== undefined && req.query.bpiMin !== ""
      ? Number(req.query.bpiMin)
      : undefined;
  const bpiMax =
    req.query.bpiMax !== undefined && req.query.bpiMax !== ""
      ? Number(req.query.bpiMax)
      : undefined;

  try {
    const { users, totalCount, songs, scores } =
      await newBpiPlayersAggregateRepo.getPage({
        limit: pageSize,
        offset: (page - 1) * pageSize,
        version,
        bpiMin: Number.isFinite(bpiMin) ? bpiMin : undefined,
        bpiMax: Number.isFinite(bpiMax) ? bpiMax : undefined,
      });

    const songById = new Map(songs.map((s) => [s.songId, s]));
    const totalSongCount = songs.length;

    const scoresByUser = new Map<
      string,
      { songId: number; exScore: number; bpi: number | null }[]
    >();
    for (const row of scores) {
      if (!scoresByUser.has(row.userId)) scoresByUser.set(row.userId, []);
      scoresByUser.get(row.userId)!.push(row);
    }

    const players = users.map((user) => {
      const userScores = scoresByUser.get(user.userId) ?? [];

      const currentBpis: number[] = [];
      let increaseCount = 0;
      let decreaseCount = 0;

      for (const s of userScores) {
        const song = songById.get(s.songId);
        if (!song) continue;

        // s.bpi(DBの保存値)は本番がV2へ全面切り替え済みのため、もはやV1
        // ではない。この検証ツールの「現行(V1)」列は常にlegacyV1で
        // 計算し直した真のV1値にする(V2は本番と同じBpiCalculator)。
        const currentBpi = v1
          .chart({
            notes: song.notes,
            kaidenAvg: song.kaidenAvg,
            wrScore: song.wrScore,
            coef: song.coef,
          })
          .bpi(s.exScore);
        if (currentBpi !== null) currentBpis.push(currentBpi);

        const newBpi = BpiCalculator.calc(s.exScore, song);

        if (currentBpi !== null && newBpi !== null) {
          if (newBpi > currentBpi + 0.005) increaseCount++;
          else if (newBpi < currentBpi - 0.005) decreaseCount++;
        }
      }

      currentBpis.sort((a, b) => b - a);
      const currentTotal = v1.total(currentBpis, totalSongCount);
      const fullNewTotal = BpiCalculator.calculateTotalBPI(
        userScores.map((s) => ({
          songId: s.songId,
          notes: songById.get(s.songId)?.notes ?? 0,
          exScore: s.exScore,
        })),
        songs,
      );

      return {
        userId: user.userId,
        userName: user.userName,
        currentTotal,
        fullNewTotal,
        increaseCount,
        decreaseCount,
        comparableCount: userScores.length,
      };
    });

    return {
      result: ok({ players, totalCount, page, pageSize }),
      ...base,
    };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), ...base };
  }
}
