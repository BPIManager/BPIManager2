import useSWR from "swr";
import { useUser } from "@/contexts/users/UserContext";
import { fetcher } from "@/utils/common/fetch";
import { API_PREFIX } from "@/constants/apiEndpoints";
import { latestVersion } from "@/constants/latestVersion";
import {
  SongWithRival,
  SongWithScore,
  RivalScore,
} from "@/types/songs/withScore";
import { BpiCalculator, IBpiBasicSongData } from "@/lib/bpi";

export type AnalyticsTargetKind =
  | "rival"
  | "rival-avg"
  | "arena"
  | "aaa"
  | "max-"
  | "wr";

export interface AnalyticsTarget {
  kind: AnalyticsTargetKind;
  param?: string;
  label: string;
}

export function encodeTarget(t: AnalyticsTarget): string {
  return encodeURIComponent(`${t.kind}:${t.param ?? ""}:${t.label}`);
}

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

interface RivalAvgRow {
  songId: number;
  title: string;
  difficulty: string;
  difficultyLevel: number;
  avgExScore: number | null;
  avgBpi: number | null;
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

  const needsMyScores =
    target?.kind === "arena" ||
    target?.kind === "aaa" ||
    target?.kind === "max-" ||
    target?.kind === "wr" ||
    target?.kind === "rival-avg";

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
