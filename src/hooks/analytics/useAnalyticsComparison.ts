import { useUser } from "@/contexts/users/UserContext";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { SongWithRival, SongWithScore } from "@/types/songs/score";
import { BpiCalculator } from "@/lib/bpi";
import { AnalyticsTarget } from "@/types/analytics";
import {
  BestEverRow,
  RivalAvgRow,
  RivalTopRow,
  SCORE_RATE,
  mergeFixedTarget,
  toBpiParams,
} from "./comparisonRows";
import {
  useArenaJson,
  useRivalAvgScores,
  useRivalTopScores,
} from "./useComparisonSources";

/**
 * アナリティクス比較ターゲット（ライバル / 旧バージョン自己 / アリーナ / AAA 目標など）に
 * 対応したスコア比較データを返すフック。
 * ターゲット種別に応じて必要な API を選択的にフェッチし、自スコアと合成して返す。
 *
 * @param target - 比較ターゲット（null の場合は何もフェッチしない）
 * @param version - IIDX バージョン（省略時は最新バージョン）
 * @returns 合成済み楽曲スコア配列・ローディング状態・エラー・ラベル文字列
 */
export const useAnalyticsComparison = (
  target: AnalyticsTarget | null,
  version?: string,
): {
  songs: SongWithRival[] | undefined;
  isLoading: boolean;
  error: Error | undefined;
  rivalLabel: string;
} => {
  const { user, fbUser } = useUser();
  const myUserId = user?.userId;
  const targetVersion = version || latestVersion;

  const {
    data: rivalData,
    error: rivalError,
    isLoading: rivalLoading,
  } = useAuthedSWRV2<SongWithRival[]>(
    target?.kind === "rival" && myUserId && target.param && fbUser
      ? `${API_V2_PREFIX}/users/${myUserId}/rivals/${target.param}/scores?version=${targetVersion}`
      : null,
    { revalidateOnFocus: false, dedupingInterval: 10000 },
  );

  const {
    data: selfVersionData,
    error: selfVersionError,
    isLoading: selfVersionLoading,
  } = useAuthedSWRV2<SongWithRival[]>(
    target?.kind === "self-version" && myUserId && target.param && fbUser
      ? `${API_V2_PREFIX}/users/${myUserId}/scores/self-version?currentVersion=${targetVersion}&targetVersion=${target.param}`
      : null,
    { revalidateOnFocus: false, dedupingInterval: 10000 },
  );

  const needsBestEver =
    target?.kind === "self-best" || target?.kind === "self-best-excl";
  const excludeCurrent = target?.kind === "self-best-excl";

  const {
    data: bestEverData,
    error: bestEverError,
    isLoading: bestEverLoading,
  } = useAuthedSWRV2<BestEverRow[]>(
    needsBestEver && myUserId && fbUser
      ? `${API_V2_PREFIX}/users/${myUserId}/scores/best-ever?currentVersion=${targetVersion}&excludeCurrent=${excludeCurrent}`
      : null,
    { revalidateOnFocus: false, dedupingInterval: 10000 },
  );

  const needsMyScores =
    target?.kind === "arena" ||
    target?.kind === "aaa" ||
    target?.kind === "max-" ||
    target?.kind === "wr" ||
    target?.kind === "rival-avg" ||
    target?.kind === "rival-top" ||
    needsBestEver;

  const {
    data: myScores,
    error: myError,
    isLoading: myLoading,
  } = useAuthedSWRV2<SongWithScore[]>(
    needsMyScores && myUserId && fbUser
      ? `${API_V2_PREFIX}/users/${myUserId}/scores?version=${targetVersion}`
      : null,
    { revalidateOnFocus: false, dedupingInterval: 10000 },
  );

  const arenaRank = target?.kind === "arena" ? (target.param ?? "A1") : "A1";
  const { rows: arenaRows, isLoading: arenaLoading } = useArenaJson(
    targetVersion,
    target?.kind === "arena" ? [11, 12] : [],
  );

  const {
    data: rivalAvgData,
    error: rivalAvgError,
    isLoading: rivalAvgLoading,
  } = useRivalAvgScores(
    target?.kind === "rival-avg" ? myUserId : undefined,
    targetVersion,
  );

  const {
    data: rivalTopData,
    error: rivalTopError,
    isLoading: rivalTopLoading,
  } = useRivalTopScores(
    target?.kind === "rival-top" ? myUserId : undefined,
    targetVersion,
  );

  if (!target) {
    return {
      songs: undefined,
      isLoading: false,
      error: undefined,
      rivalLabel: "",
    };
  }

  if (target.kind === "rival") {
    return {
      songs: rivalData,
      isLoading: rivalLoading,
      error: rivalError,
      rivalLabel: target.label,
    };
  }

  if (target.kind === "self-version") {
    return {
      songs: selfVersionData,
      isLoading: selfVersionLoading,
      error: selfVersionError,
      rivalLabel: target.label,
    };
  }

  if (target.kind === "self-best" || target.kind === "self-best-excl") {
    if (bestEverLoading || myLoading) {
      return {
        songs: undefined,
        isLoading: true,
        error: undefined,
        rivalLabel: target.label,
      };
    }

    const bestMap = new Map<string, BestEverRow>();
    for (const row of bestEverData ?? []) {
      bestMap.set(`${row.songId}__${row.difficulty}`, row);
    }

    const songs = (myScores ?? []).map((s) => {
      const best = bestMap.get(`${s.songId}__${s.difficulty}`);
      return mergeFixedTarget(
        s,
        best?.bestExScore ?? null,
        best?.bestBpi ?? null,
      );
    });

    return {
      songs,
      isLoading: false,
      error: bestEverError ?? myError,
      rivalLabel: target.label,
    };
  }

  if (myLoading || (target.kind === "arena" && arenaLoading)) {
    return {
      songs: undefined,
      isLoading: true,
      error: undefined,
      rivalLabel: target.label,
    };
  }
  if (!myScores) {
    return {
      songs: undefined,
      isLoading: false,
      error: myError,
      rivalLabel: target.label,
    };
  }

  if (target.kind === "arena") {
    const arenaMap = new Map<
      string,
      { avgExScore: number; avgBpi: number | null }
    >();
    for (const row of arenaRows) {
      const avg = row.averages[arenaRank];
      if (avg) {
        arenaMap.set(`${row.title}__${row.difficulty}`, {
          avgExScore: Math.round(avg.avgExScore),
          avgBpi: avg.avgBpi ?? null,
        });
      }
    }

    // アリーナ集計データはsongIdを持たずtitleでしか突合できないため、
    // 同名リメイク曲(同じtitle__difficultyで異なるsongId)がmyScoresに
    // 混在する場合は誤ったアリーナ平均と静かにマージされてしまう。
    // そのようなキーは安全側に倒して突合自体をスキップする。
    const songIdsByTitleKey = new Map<string, Set<number>>();
    for (const s of myScores) {
      const key = `${s.title}__${s.difficulty}`;
      if (!songIdsByTitleKey.has(key)) songIdsByTitleKey.set(key, new Set());
      songIdsByTitleKey.get(key)!.add(s.songId);
    }

    const songs = myScores.map((s) => {
      const key = `${s.title}__${s.difficulty}`;
      const isAmbiguous = (songIdsByTitleKey.get(key)?.size ?? 0) > 1;
      const arena = isAmbiguous ? null : (arenaMap.get(key) ?? null);
      return mergeFixedTarget(
        s,
        arena?.avgExScore ?? null,
        arena?.avgBpi ?? null,
      );
    });

    return {
      songs,
      isLoading: false,
      error: undefined,
      rivalLabel: target.label,
    };
  }

  if (target.kind === "rival-avg") {
    if (rivalAvgLoading) {
      return {
        songs: undefined,
        isLoading: true,
        error: undefined,
        rivalLabel: target.label,
      };
    }

    const avgMap = new Map<string, RivalAvgRow>();
    for (const row of rivalAvgData ?? []) {
      avgMap.set(`${row.songId}__${row.difficulty}`, row);
    }

    const songs = myScores.map((s) => {
      const avg = avgMap.get(`${s.songId}__${s.difficulty}`);
      const avgEx = avg?.avgExScore != null ? Math.round(avg.avgExScore) : null;
      const avgBpi = avg?.avgBpi != null ? Number(avg.avgBpi) : null;
      return mergeFixedTarget(s, avgEx, avgBpi);
    });

    return {
      songs,
      isLoading: false,
      error: rivalAvgError,
      rivalLabel: target.label,
    };
  }

  if (target.kind === "rival-top") {
    if (rivalTopLoading) {
      return {
        songs: undefined,
        isLoading: true,
        error: undefined,
        rivalLabel: target.label,
      };
    }

    const topMap = new Map<string, RivalTopRow>();
    for (const row of rivalTopData ?? []) {
      topMap.set(`${row.songId}__${row.difficulty}`, row);
    }

    const songs = myScores.map((s) => {
      const top = topMap.get(`${s.songId}__${s.difficulty}`);
      const topEx = top?.topExScore != null ? Math.round(top.topExScore) : null;
      const topBpi = top?.topBpi != null ? Number(top.topBpi) : null;
      return mergeFixedTarget(s, topEx, topBpi);
    });

    return {
      songs,
      isLoading: false,
      error: rivalTopError,
      rivalLabel: target.label,
    };
  }

  if (target.kind === "aaa" || target.kind === "max-" || target.kind === "wr") {
    const songs = myScores.map((s) => {
      const params = toBpiParams(s);
      const maxScore = s.notes * 2;

      const targetEx: number | null =
        target.kind === "wr"
          ? (s.wrScore ?? null)
          : maxScore > 0
            ? Math.ceil(maxScore * SCORE_RATE[target.kind as "aaa" | "max-"])
            : null;

      const targetBpi =
        targetEx !== null && params.kaidenAvg && params.wrScore
          ? (BpiCalculator.calc(targetEx, params) ?? null)
          : null;

      return mergeFixedTarget(s, targetEx, targetBpi);
    });

    return {
      songs,
      isLoading: false,
      error: undefined,
      rivalLabel: target.label,
    };
  }

  return {
    songs: undefined,
    isLoading: false,
    error: undefined,
    rivalLabel: "",
  };
};
