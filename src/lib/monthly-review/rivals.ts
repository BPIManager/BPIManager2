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

/**
 * `scores.lastPlayed`基準のシフト法再計算結果（{@link recomputeBpiTimelinesForUsers}）を
 * 各ライバル（`RivalDiff`）に反映し、推移グラフ用のタイムラインMapを組み立てる。
 *
 * @param recomputedByUser - ライバルごとの再計算結果。`bpiStart`が`null`のライバルは
 *   （`compareVersion`モードでそのバージョンのスコアが無く）前バージョンとの伸び率
 *   比較が不能なため、ランキング側では除外するが、推移グラフ自体（`bpiEnd`/`history`）
 *   はそのバージョン内の純粋な推移として引き続き表示する
 */
export function attachRivalBpiTimelines(
  rivals: RivalDiff[],
  recomputedByUser: Map<
    string,
    { bpiStart: number | null; bpiEnd: number; history: { date: string; value: number }[] }
  >,
): Map<string, { date: string; value: number }[]> {
  const rivalComputedTimeline = new Map<
    string,
    { date: string; value: number }[]
  >();
  for (const r of rivals) {
    const recomputed = recomputedByUser.get(r.userId);
    if (!recomputed) continue;

    if (recomputed.history.length > 0)
      rivalComputedTimeline.set(r.userId, recomputed.history);

    if (recomputed.bpiStart === null) {
      // 前バージョンとの伸び率比較が不能（bpiStart/bpiEnd/bpiGrowthはRivalDiff
      // 初期値のnullのまま。「-」として末尾に表示される。buildGrowthRanking参照）
      continue;
    }
    r.bpiStart = recomputed.bpiStart;
    r.bpiEnd = recomputed.bpiEnd;
    r.bpiGrowth = Math.round((recomputed.bpiEnd - recomputed.bpiStart) * 100) / 100;
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

  // 比較先バージョンのデータが無いライバル（bpiGrowth/bpiStartがnull）も
  // 伸び率ランキング側では「-」として末尾に表示するため、ここでは除外しない
  for (const r of rivals) {
    const growthRate =
      r.bpiGrowth !== null && r.bpiStart !== null && r.bpiStart > -15
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

  if (growthEntries.length === 0) return null;
  return {
    byAbsGrowth: [...growthEntries]
      .filter((e) => e.bpiGrowth !== null)
      .sort((a, b) => b.bpiGrowth! - a.bpiGrowth!),
    // growthRateがある者を降順、無い者（比較データ無し＝「-」）は末尾に
    byGrowthRate: [...growthEntries].sort((a, b) => {
      if (a.growthRate === null && b.growthRate === null) return 0;
      if (a.growthRate === null) return 1;
      if (b.growthRate === null) return -1;
      return b.growthRate - a.growthRate;
    }),
  };
}

/**
 * @param usingCompareVersion - `true`（全期間モード）の場合、チャートの起点を
 *   前バージョンの値で汚さない。「前バージョンからの伸び」は2点比較の
 *   ランキング側（buildGrowthRanking）だけの概念とし、推移グラフ自体は
 *   そのバージョン内で実際に記録された最初のログを基準にした自己相対の
 *   純粋な成長推移として表示する
 */
export function buildGrowthTimeline(
  rivals: RivalDiff[],
  rivalComputedTimeline: Map<string, { date: string; value: number }[]>,
  viewerId: string,
  bpiHistory: { date: string; value: number }[],
  bpiStart: number,
  bpiEnd: number,
  monthStart: string,
  usingCompareVersion: boolean,
): GrowthParticipant[] | null {
  const result: GrowthParticipant[] = [];

  if (usingCompareVersion) {
    if (bpiHistory.length > 0) {
      result.push({
        userId: viewerId,
        userName: "あなた",
        isViewer: true,
        profileImage: null,
        bpiBase: bpiHistory[0].value,
        history: bpiHistory.map((h) => ({ date: h.date, bpi: h.value })),
      });
    }
    for (const r of rivals) {
      const rawHistory = rivalComputedTimeline.get(r.userId) ?? [];
      if (rawHistory.length === 0) continue;
      result.push({
        userId: r.userId,
        userName: r.userName,
        isViewer: false,
        profileImage: r.profileImage,
        bpiBase: rawHistory[0].value,
        history: rawHistory.map((h) => ({ date: h.date, bpi: h.value })),
      });
    }
    return result.length > 0 ? result : null;
  }

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
    // 比較先バージョンのデータが無いライバル（bpiStart未計算）はグラフの
    // baselineが定まらないため描画対象から除外する
    if (r.bpiStart === null) continue;
    const rawHistory = rivalComputedTimeline.get(r.userId) ?? [];
    const history = rawHistory.map((h) => ({ date: h.date, bpi: h.value }));
    const base = r.bpiStart;
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
