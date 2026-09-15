import dayjs from "@/lib/dayjs";
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
 * `userStatusLogs.totalBpi`ログに基づき、各ライバルの総合BPI推移を組み立てる
 * （{@link computeOwnerBpiTimeline}と同じ設計。シフト法での再計算はしない）。
 *
 * @param rivalLogsInRange - 期間内の全ライバル分totalBpiログ（時系列順である必要はない）
 * @param rivalBaselineLogs - baseline用ログ。`compareVersion`指定時は各ライバルの
 *   そのバージョン内最新ログ、省略時は期間開始前の直近ログ
 * @param requireBaseline - `true`の場合、baselineログが無いライバル（＝比較対象
 *   バージョンのデータが無い）は比較不能として除外する（全期間モード用）。
 *   `false`の場合はbaseline無しを`-15`扱いにする（月内比較で期間開始前に
 *   データが無い＝新規ユーザーのケース）
 * @param fallbackByUser - `userStatusLogs`にこの期間のログが1件も無い（baseline・
 *   期間内更新のどちらも無い）ライバル向けの、`scores.lastPlayed`基準シフト法
 *   再計算結果（{@link recomputeBpiTimelinesForUsers}）。バックフィル・遅延同期
 *   ユーザー対応。該当ライバルにだけ絞って渡す想定
 */
export function attachRivalBpiTimelines(
  rivals: RivalDiff[],
  rivalLogsInRange: { userId: string; totalBpi: unknown; createdAt: Date | string }[],
  rivalBaselineLogs: { userId: string; totalBpi: unknown }[],
  useMonthBuckets: boolean,
  requireBaseline: boolean,
  fallbackByUser?: Map<
    string,
    { bpiStart: number; bpiEnd: number; history: { date: string; value: number }[] }
  >,
): Map<string, { date: string; value: number }[]> {
  const logsByUser = new Map<string, { date: string; value: number }[]>();
  for (const row of rivalLogsInRange) {
    if (row.totalBpi == null) continue;
    const arr = logsByUser.get(row.userId) ?? [];
    arr.push({
      date: dayjs(row.createdAt).tz().format("YYYY-MM-DD"),
      value: Number(row.totalBpi),
    });
    logsByUser.set(row.userId, arr);
  }

  const baselineByUser = new Map<string, number>();
  for (const row of rivalBaselineLogs) {
    if (row.totalBpi != null) baselineByUser.set(row.userId, Number(row.totalBpi));
  }

  const rivalComputedTimeline = new Map<
    string,
    { date: string; value: number }[]
  >();
  for (const r of rivals) {
    const rawHistory = (logsByUser.get(r.userId) ?? []).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    // 年次/全期間モードは日次だと点が多すぎるため月単位に間引く（同月内は最後の値を採用）
    const historyMap = new Map<string, number>();
    for (const h of rawHistory) {
      const key = useMonthBuckets ? h.date.slice(0, 7) : h.date;
      historyMap.set(key, h.value);
    }
    const history = Array.from(historyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => ({ date: useMonthBuckets ? `${key}-01` : key, value }));

    const baseline = baselineByUser.get(r.userId);
    const hasLogCoverage = baseline !== undefined || history.length > 0;

    // バックフィル等でこの期間に対応するログが1件も無いライバルのみ、
    // scores.lastPlayed基準の再計算結果にフォールバックする
    const fallback = !hasLogCoverage ? fallbackByUser?.get(r.userId) : undefined;
    if (fallback) {
      if (fallback.history.length > 0)
        rivalComputedTimeline.set(r.userId, fallback.history);
      r.bpiStart = fallback.bpiStart;
      r.bpiEnd = fallback.bpiEnd;
      r.bpiGrowth = Math.round((fallback.bpiEnd - fallback.bpiStart) * 100) / 100;
      continue;
    }

    // タイムライン（推移グラフ用）はbaselineの有無に関わらず保持する。
    // 「前バージョンとの伸び率」比較が不能な場合でも、そのバージョン内での
    // 純粋な推移自体は表示できるため（buildGrowthTimeline参照）
    if (history.length > 0) rivalComputedTimeline.set(r.userId, history);

    if (requireBaseline && baseline === undefined) {
      // このライバルのcompareVersion内データが無い＝前バージョンとの伸び率比較は不能
      // （bpiStart/bpiEnd/bpiGrowthはRivalDiff初期値のnullのまま）
      continue;
    }
    const bpiStart = baseline ?? -15;
    // 期間内にログが1件も無ければ「更新なし」＝baselineのまま
    const bpiEnd = history.length > 0 ? history[history.length - 1].value : bpiStart;

    r.bpiStart = bpiStart;
    r.bpiEnd = bpiEnd;
    r.bpiGrowth = Math.round((bpiEnd - bpiStart) * 100) / 100;
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
