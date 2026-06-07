import { buildBpiTimeline } from "./bpi";
import type {
  RivalDiff,
  RivalSongHighlight,
  RivalBpiGrowthEntry,
  GrowthParticipant,
} from "@/types/stats/monthlyReview";

type RivalScoreRow = {
  userId: string;
  userName: string;
  profileImage: string | null;
  songId: number;
  exScore: number;
};

type UserScoreRow = {
  songId: number;
  exScore: number;
  title: string;
  difficulty: string;
  difficultyLevel: number;
};

export function buildRivals(
  userCurrentL1112: UserScoreRow[],
  rivalL1112Scores: RivalScoreRow[],
  userPreL1112Map: Map<number, number>,
): RivalDiff[] {
  const userCurrentMap = new Map<
    number,
    { exScore: number; title: string; difficulty: string; difficultyLevel: number }
  >();
  for (const s of userCurrentL1112) {
    userCurrentMap.set(s.songId, {
      exScore: s.exScore,
      title: s.title,
      difficulty: s.difficulty,
      difficultyLevel: s.difficultyLevel,
    });
  }

  const rivalMap = new Map<
    string,
    {
      userId: string;
      userName: string;
      profileImage: string | null;
      songScores: Map<number, number>;
    }
  >();
  for (const r of rivalL1112Scores) {
    if (!rivalMap.has(r.userId)) {
      rivalMap.set(r.userId, {
        userId: r.userId,
        userName: r.userName,
        profileImage: r.profileImage ?? null,
        songScores: new Map(),
      });
    }
    rivalMap.get(r.userId)!.songScores.set(r.songId, r.exScore);
  }

  const rivals: RivalDiff[] = [];
  for (const rival of rivalMap.values()) {
    let newWins = 0;
    let newLosses = 0;
    const winningSongs: RivalSongHighlight[] = [];

    for (const [songId, rivalEx] of rival.songScores) {
      const userCurrent = userCurrentMap.get(songId);
      if (!userCurrent) continue;

      const userCurrentEx = userCurrent.exScore;
      if (userPreL1112Map.has(songId)) {
        const userPreEx = userPreL1112Map.get(songId)!;
        const wasWinning = userPreEx > rivalEx;
        const isWinning = userCurrentEx > rivalEx;
        if (!wasWinning && isWinning) newWins++;
        if (wasWinning && !isWinning) newLosses++;
      }

      if (userCurrentEx > rivalEx) {
        winningSongs.push({
          songId,
          title: userCurrent.title,
          difficulty: userCurrent.difficulty,
          difficultyLevel: userCurrent.difficultyLevel,
          userExScore: userCurrentEx,
          rivalExScore: rivalEx,
          margin: userCurrentEx - rivalEx,
        });
      }
    }

    winningSongs.sort((a, b) => b.margin - a.margin);

    if (newWins > 0 || newLosses > 0 || winningSongs.length > 0) {
      rivals.push({
        userId: rival.userId,
        userName: rival.userName,
        profileImage: rival.profileImage,
        newWins,
        newLosses,
        topWinningSongs: winningSongs,
        bpiStart: null,
        bpiEnd: null,
        bpiGrowth: null,
      });
    }
  }

  rivals.sort((a, b) => b.newWins - b.newLosses - (a.newWins - a.newLosses));
  return rivals;
}

export function attachRivalBpiTimelines(
  rivals: RivalDiff[],
  rivalPreMonthState: { userId: string; songId: number; bpi: unknown }[],
  rivalInMonthHistory: {
    userId: string;
    songId: number;
    bpi: unknown;
    lastPlayed: Date | string;
  }[],
  totalSongs: number,
  isYearMode: boolean,
): Map<string, { date: string; value: number }[]> {
  const rivalPreMonthByUser = new Map<string, Map<number, number>>();
  for (const s of rivalPreMonthState) {
    if (!rivalPreMonthByUser.has(s.userId))
      rivalPreMonthByUser.set(s.userId, new Map());
    rivalPreMonthByUser
      .get(s.userId)!
      .set(s.songId, s.bpi != null ? Number(s.bpi) : -15);
  }

  const rivalInMonthByUser = new Map<string, typeof rivalInMonthHistory>();
  for (const e of rivalInMonthHistory) {
    const arr = rivalInMonthByUser.get(e.userId) ?? [];
    arr.push(e);
    rivalInMonthByUser.set(e.userId, arr);
  }

  const rivalComputedTimeline = new Map<
    string,
    { date: string; value: number }[]
  >();
  for (const r of rivals) {
    const preMap =
      rivalPreMonthByUser.get(r.userId) ?? new Map<number, number>();
    const rawInMonth = rivalInMonthByUser.get(r.userId) ?? [];
    const inMonth = rawInMonth.map((e) => ({
      songId: e.songId,
      bpi: e.bpi != null ? (e.bpi as number) : null,
      lastPlayed: e.lastPlayed,
    }));
    const { history, bpiStart: rBpiStart, bpiEnd: rBpiEnd } = buildBpiTimeline(
      preMap,
      inMonth,
      totalSongs,
      isYearMode,
    );
    r.bpiStart = rBpiStart;
    r.bpiEnd = rBpiEnd;
    r.bpiGrowth = Math.round((rBpiEnd - rBpiStart) * 100) / 100;
    rivalComputedTimeline.set(r.userId, history);
  }

  return rivalComputedTimeline;
}

export function buildGrowthRanking(
  rivals: RivalDiff[],
  viewerId: string,
  bpiDiff: number,
  bpiStart: number,
) {
  const growthEntries: RivalBpiGrowthEntry[] = [];

  const viewerGrowthRate =
    bpiStart > -15
      ? Math.round((bpiDiff / (bpiStart + 15)) * 10000) / 100
      : null;
  growthEntries.push({
    userId: viewerId,
    userName: "あなた",
    profileImage: null,
    isViewer: true,
    bpiGrowth: bpiDiff,
    growthRate: viewerGrowthRate,
  });

  for (const r of rivals) {
    if (r.bpiGrowth !== null && r.bpiStart !== null) {
      const growthRate =
        r.bpiStart > -15
          ? Math.round((r.bpiGrowth / (r.bpiStart + 15)) * 10000) / 100
          : null;
      growthEntries.push({
        userId: r.userId,
        userName: r.userName,
        profileImage: r.profileImage,
        isViewer: false,
        bpiGrowth: r.bpiGrowth,
        growthRate,
      });
    }
  }

  if (growthEntries.length === 0) return null;
  return {
    byAbsGrowth: [...growthEntries].sort((a, b) => b.bpiGrowth - a.bpiGrowth),
    byGrowthRate: [...growthEntries]
      .filter((e) => e.growthRate !== null)
      .sort((a, b) => (b.growthRate ?? 0) - (a.growthRate ?? 0)),
  };
}

export function buildGrowthTimeline(
  rivals: RivalDiff[],
  rivalComputedTimeline: Map<string, { date: string; value: number }[]>,
  viewerId: string,
  bpiHistory: { date: string; value: number }[],
  bpiStart: number,
  bpiEnd: number,
  monthStart: string,
): GrowthParticipant[] | null {
  const result: GrowthParticipant[] = [];

  if (bpiHistory.length > 0 || bpiStart !== bpiEnd) {
    const viewerHistory = bpiHistory.map((h) => ({ date: h.date, bpi: h.value }));
    if (viewerHistory[0]?.date !== monthStart) {
      viewerHistory.unshift({ date: monthStart, bpi: bpiStart });
    }
    result.push({
      userId: viewerId,
      userName: "あなた",
      isViewer: true,
      profileImage: null,
      bpiBase: bpiStart,
      history: viewerHistory,
    });
  }

  for (const r of rivals) {
    const rawHistory = rivalComputedTimeline.get(r.userId) ?? [];
    const history = rawHistory.map((h) => ({ date: h.date, bpi: h.value }));
    const base = r.bpiStart ?? history[0]?.bpi ?? 0;
    if (history[0]?.date !== monthStart) {
      history.unshift({ date: monthStart, bpi: base });
    }
    result.push({
      userId: r.userId,
      userName: r.userName,
      isViewer: false,
      profileImage: r.profileImage,
      bpiBase: base,
      history,
    });
  }

  return result.length > 0 ? result : null;
}
