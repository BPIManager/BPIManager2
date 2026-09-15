import { buildBpiTimeline, calculateTotalBpiForScores } from "./bpi";
import type {
  RivalDiff,
  RivalSongHighlight,
  RivalBpiGrowthEntry,
  GrowthParticipant,
} from "@/types/stats/monthlyReview";
import type { IBpiBasicSongData } from "@/types/songs/bpi";

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
 * DBから受け取ったbpi値(decimal列のため文字列で返る場合を含むunknown)を、
 * 未設定時のフォールバック込みでnumberへ変換する。
 *
 * `as number`のような無検証キャストだと文字列がそのまま紛れ込んでも
 * 気づけないため、必ずNumber()で変換してから扱う。
 */
function toBpiNumber<T>(bpi: unknown, fallback: T): number | T {
  return bpi != null ? Number(bpi) : fallback;
}

/**
 * @param rivalPreMonthState - 月内比較（`compareVersion`省略時）用の「期間開始前の
 *   直近スコア」。`compareVersion`指定時は使わない
 * @param rivalCompareVersionState - 全期間モード用、各ライバルの`compareVersion`内
 *   での最新スコア。渡された場合はこちらをbaselineとして使い、かつ`bpiEnd`/`history`
 *   の計算には（ratchet+baseline混在によるdiff固定化を避けるため）常に空のseedを使う
 *   （computeOwnerBpiTimelineと同じ設計）。該当ライバルにこのバージョンのデータが
 *   1件も無い場合は`bpiStart`/`bpiEnd`/`bpiGrowth`を`null`のままにする
 *   （＝比較不能として除外する）
 */
export function attachRivalBpiTimelines(
  rivals: RivalDiff[],
  rivalPreMonthState: { userId: string; songId: number; exScore: unknown }[],
  rivalInMonthHistory: {
    userId: string;
    songId: number;
    exScore: unknown;
    lastPlayed: Date | string;
  }[],
  songMaster: (IBpiBasicSongData & { songId: number })[],
  useMonthBuckets: boolean,
  rivalCompareVersionState?: { userId: string; songId: number; exScore: unknown }[],
): Map<string, { date: string; value: number }[]> {
  const rivalPreMonthByUser = new Map<string, Map<number, number>>();
  for (const s of rivalPreMonthState) {
    if (s.exScore == null) continue;
    if (!rivalPreMonthByUser.has(s.userId))
      rivalPreMonthByUser.set(s.userId, new Map());
    rivalPreMonthByUser.get(s.userId)!.set(s.songId, Number(s.exScore));
  }

  const rivalCompareVersionByUser = new Map<string, Map<number, number>>();
  for (const s of rivalCompareVersionState ?? []) {
    if (s.exScore == null) continue;
    if (!rivalCompareVersionByUser.has(s.userId))
      rivalCompareVersionByUser.set(s.userId, new Map());
    rivalCompareVersionByUser.get(s.userId)!.set(s.songId, Number(s.exScore));
  }

  const rivalInMonthByUser = new Map<string, typeof rivalInMonthHistory>();
  for (const e of rivalInMonthHistory) {
    const arr = rivalInMonthByUser.get(e.userId) ?? [];
    arr.push(e);
    rivalInMonthByUser.set(e.userId, arr);
  }

  const usingCompareVersion = !!rivalCompareVersionState;

  const rivalComputedTimeline = new Map<
    string,
    { date: string; value: number }[]
  >();
  for (const r of rivals) {
    const rawInMonth = rivalInMonthByUser.get(r.userId) ?? [];
    const inMonth = rawInMonth.map((e) => ({
      songId: e.songId,
      exScore: toBpiNumber(e.exScore, null),
      lastPlayed: e.lastPlayed,
    }));

    if (usingCompareVersion) {
      const compareMap = rivalCompareVersionByUser.get(r.userId);
      if (!compareMap || compareMap.size === 0) {
        // このライバルのcompareVersion内データが無い＝比較不能
        continue;
      }
      const { history, bpiEnd: rBpiEnd } = buildBpiTimeline(
        new Map(),
        inMonth,
        songMaster,
        useMonthBuckets,
      );
      const rBpiStart = calculateTotalBpiForScores(compareMap, songMaster);
      r.bpiStart = rBpiStart;
      r.bpiEnd = rBpiEnd;
      r.bpiGrowth = Math.round((rBpiEnd - rBpiStart) * 100) / 100;
      rivalComputedTimeline.set(r.userId, history);
    } else {
      const preMap =
        rivalPreMonthByUser.get(r.userId) ?? new Map<number, number>();
      const { history, bpiStart: rBpiStart, bpiEnd: rBpiEnd } = buildBpiTimeline(
        preMap,
        inMonth,
        songMaster,
        useMonthBuckets,
      );
      r.bpiStart = rBpiStart;
      r.bpiEnd = rBpiEnd;
      r.bpiGrowth = Math.round((rBpiEnd - rBpiStart) * 100) / 100;
      rivalComputedTimeline.set(r.userId, history);
    }
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
