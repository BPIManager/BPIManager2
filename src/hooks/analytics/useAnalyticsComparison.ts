import useSWR from "swr";
import { useUser } from "@/contexts/users/UserContext";
import { fetcher } from "@/utils/common/fetch";
import { API_PREFIX } from "@/constants/apiEndpoints";
import { latestVersion } from "@/constants/latestVersion";
import {
  SongWithRival,
  SongWithScore,
  RivalScore,
} from "@/types/songs/score";
import { BpiCalculator } from "@/lib/bpi";
import type { IBpiBasicSongData } from "@/types/songs/bpi";
import {
  AnalyticsTargetKind,
  AnalyticsTarget,
} from "@/types/analytics";

/**
 * {@link AnalyticsTarget} を URL クエリに埋め込める文字列にエンコードする。
 *
 * @param t - エンコード対象のターゲット
 * @returns `encodeURIComponent` 済みの文字列
 */
export function encodeTarget(t: AnalyticsTarget): string {
  return encodeURIComponent(`${t.kind}:${t.param ?? ""}:${t.label}`);
}

/**
 * {@link encodeTarget} でエンコードされた文字列を {@link AnalyticsTarget} にデコードする。
 *
 * @param raw - エンコード済み文字列
 * @returns デコード結果。パースに失敗した場合は `null`
 */
export function decodeTarget(raw: string): AnalyticsTarget | null {
  try {
    const decoded = decodeURIComponent(raw);
    const [kind, param, ...labelParts] = decoded.split(":");
    const label = labelParts.join(":");
    if (!kind) return null;
    return {
      kind: kind as AnalyticsTargetKind,
      param: param || undefined,
      label,
    };
  } catch {
    return null;
  }
}

interface ArenaAverageRow {
  title: string;
  difficulty: string;
  notes: number;
  maxScore: number;
  averages: Record<
    string,
    { avgExScore: number; rate: number; count: number; avgBpi?: number }
  >;
}

interface RivalCommonRow {
  songId: number;
  title: string;
  difficulty: string;
  difficultyLevel: number;
}

interface RivalAvgRow extends RivalCommonRow {
  avgExScore: number | null;
  avgBpi: number | null;
}

interface RivalTopRow extends RivalCommonRow {
  topExScore: number | null;
  topBpi: number | null;
}

interface BestEverRow {
  songId: number;
  title: string;
  difficulty: string;
  difficultyLevel: number;
  notes: number;
  bpm: string | null;
  releasedVersion: number | null;
  bestExScore: number | null;
  bestBpi: number | null;
  bestVersion: string | null;
  wrScore: number | null;
  kaidenAvg: number | null;
  coef: number | null;
}

function toBpiParams(s: SongWithScore): IBpiBasicSongData {
  return {
    notes: s.notes,
    kaidenAvg: s.kaidenAvg,
    wrScore: s.wrScore,
    coef: s.coef,
  };
}

function mergeFixedTarget(
  s: SongWithScore,
  targetEx: number | null,
  targetBpi: number | null,
): SongWithRival {
  const exDiff =
    s.exScore !== null && targetEx !== null ? s.exScore - targetEx : undefined;
  const bpiDiff =
    s.bpi !== null && targetBpi !== null
      ? Math.round((Number(s.bpi) - targetBpi) * 100) / 100
      : undefined;

  const rival: RivalScore = {
    exScore: targetEx,
    bpi: targetBpi,
    clearState: null,
    missCount: null,
    lastPlayed: null,
  };

  return { ...s, rival, exDiff, bpiDiff } as SongWithRival;
}

const SCORE_RATE: Record<"aaa" | "max-", number> = {
  aaa: 8 / 9,
  "max-": 17 / 18,
};

const useRivalAvgScores = (userId: string | undefined, version: string) => {
  const { fbUser } = useUser();
  const { data, error, isLoading } = useSWR<RivalAvgRow[]>(
    userId && fbUser
      ? [
          `${API_PREFIX}/users/${userId}/rivals/following/avg-scores?version=${version}`,
          fbUser,
        ]
      : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 10000 },
  );
  return { data, error, isLoading };
};

const useRivalTopScores = (userId: string | undefined, version: string) => {
  const { fbUser } = useUser();
  const { data, error, isLoading } = useSWR<RivalTopRow[]>(
    userId && fbUser
      ? [
          `${API_PREFIX}/users/${userId}/rivals/following/top-scores?version=${version}`,
          fbUser,
        ]
      : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 10000 },
  );
  return { data, error, isLoading };
};

const useArenaJson = (version: string, levels: number[]) => {
  const v = "32";
  const { data: data11, isLoading: l11 } = useSWR<ArenaAverageRow[]>(
    levels.includes(11) ? `/data/metrics/arena/${v}_11.json` : null,
    fetcher,
    { revalidateOnFocus: false },
  );
  const { data: data12, isLoading: l12 } = useSWR<ArenaAverageRow[]>(
    levels.includes(12) ? `/data/metrics/arena/${v}_12.json` : null,
    fetcher,
    { revalidateOnFocus: false },
  );
  return {
    rows: [...(data11 ?? []), ...(data12 ?? [])],
    isLoading: l11 || l12,
  };
};

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
  } = useSWR<SongWithRival[]>(
    target?.kind === "rival" && myUserId && target.param && fbUser
      ? [
          `${API_PREFIX}/users/${myUserId}/rivals/${target.param}/scores?version=${targetVersion}`,
          fbUser,
        ]
      : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 10000 },
  );

  const {
    data: selfVersionData,
    error: selfVersionError,
    isLoading: selfVersionLoading,
  } = useSWR<SongWithRival[]>(
    target?.kind === "self-version" && myUserId && target.param && fbUser
      ? [
          `${API_PREFIX}/users/${myUserId}/scores/self-version?currentVersion=${targetVersion}&targetVersion=${target.param}`,
          fbUser,
        ]
      : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 10000 },
  );

  const needsBestEver =
    target?.kind === "self-best" || target?.kind === "self-best-excl";
  const excludeCurrent = target?.kind === "self-best-excl";

  const {
    data: bestEverData,
    error: bestEverError,
    isLoading: bestEverLoading,
  } = useSWR<BestEverRow[]>(
    needsBestEver && myUserId && fbUser
      ? [
          `${API_PREFIX}/users/${myUserId}/scores/best-ever?currentVersion=${targetVersion}&excludeCurrent=${excludeCurrent}`,
          fbUser,
        ]
      : null,
    fetcher,
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
  } = useSWR<SongWithScore[]>(
    needsMyScores && myUserId && fbUser
      ? [
          `${API_PREFIX}/users/${myUserId}/scores?version=${targetVersion}`,
          fbUser,
        ]
      : null,
    fetcher,
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

    const songs = myScores.map((s) => {
      const arena = arenaMap.get(`${s.title}__${s.difficulty}`) ?? null;
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
