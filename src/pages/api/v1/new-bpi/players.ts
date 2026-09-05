import { NextApiResponse } from "next";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { newBpiPlayersAggregateRepo } from "@/lib/db/aggregates/newBpiPlayers";
import { BpiCalculator } from "@/lib/bpi";
import { NewBpiCalculator } from "@/lib/bpi/newBpi";
import {
  newBpiSongParamMap,
  NEW_BPI_Z0,
  NEW_BPI_Z100,
} from "@/constants/iidx/newBpi/songParams";
import { latestVersion } from "@/constants/iidx/iidxVersions";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

/**
 * issue #299〜304検証用: 公開ユーザーをページ単位で列挙し、それぞれの
 * 総合BPI(現行/単曲のみ新方式/単曲・総合とも新方式)と単曲の増減数を返す。
 *
 * 計算量を抑えるため、DBから読むスコアはそのページに含まれる公開ユーザー分
 * のみに絞る({@link newBpiPlayersAggregateRepo.getPage}参照)。BPIの実計算は
 * ここ(APIハンドラ)で行う。
 */
async function handler(req: AuthenticatedNextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.status(405).end();
    return;
  }

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

  const scoresByUser = new Map<string, { songId: number; exScore: number }[]>();
  for (const row of scores) {
    if (!scoresByUser.has(row.userId)) scoresByUser.set(row.userId, []);
    scoresByUser.get(row.userId)!.push(row);
  }

  const players = users.map((user) => {
    const userScores = scoresByUser.get(user.userId) ?? [];

    const currentBpis: number[] = [];
    const newBpis: number[] = [];
    let increaseCount = 0;
    let decreaseCount = 0;
    let num = 0;
    let den = 0;

    for (const s of userScores) {
      const song = songById.get(s.songId);
      if (!song) continue;

      const currentBpi = BpiCalculator.calc(s.exScore, {
        notes: song.notes,
        kaidenAvg: song.kaidenAvg,
        wrScore: song.wrScore,
        coef: song.coef,
      });
      if (currentBpi !== null) currentBpis.push(currentBpi);

      const newBpi = NewBpiCalculator.calc(s.exScore, {
        songId: s.songId,
        notes: song.notes,
        kaidenAvg: song.kaidenAvg,
        wrScore: song.wrScore,
      });
      if (newBpi !== null) newBpis.push(newBpi);

      if (currentBpi !== null && newBpi !== null) {
        if (newBpi > currentBpi + 0.005) increaseCount++;
        else if (newBpi < currentBpi - 0.005) decreaseCount++;
      }

      const param = newBpiSongParamMap.get(s.songId);
      if (param) {
        const m = song.notes * 2;
        const miss = Math.max(0.5, m - Math.min(s.exScore, m));
        const t = -Math.log(miss);
        num += param.sigma * (t - param.mu);
        den += param.sigma * param.sigma;
      }
    }

    currentBpis.sort((a, b) => b - a);
    newBpis.sort((a, b) => b - a);
    const currentTotal = BpiCalculator.calculateTotalBPI(currentBpis, totalSongCount);
    const hybridTotal = BpiCalculator.calculateTotalBPI(newBpis, totalSongCount);
    const a = den > 0 ? num / den : null;
    const fullNewTotal =
      a !== null
        ? Math.round(100 * ((a - NEW_BPI_Z0) / (NEW_BPI_Z100 - NEW_BPI_Z0)) * 100) / 100
        : null;

    return {
      userId: user.userId,
      userName: user.userName,
      currentTotal,
      hybridTotal,
      fullNewTotal,
      increaseCount,
      decreaseCount,
      comparableCount: userScores.length,
    };
  });

  return res.status(200).json({
    players,
    totalCount,
    page,
    pageSize,
  });
}

export default withAuth(handler);
