import { useMemo, useState } from "react";
import { useUserScores } from "@/hooks/table/useUserScores";
import { useTotalBpiStats } from "@/hooks/stats/useCurrentTotalBpi";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import {
  newBpiSongParamMap,
  NEW_BPI_Z0,
  NEW_BPI_Z100,
} from "@/constants/iidx/newBpi/songParams";
import { NewBpiCalculator } from "@/lib/bpi/newBpi";
import { PageLoader } from "@/components/ui/loading-spinner";
import NewBpiComparisonUi, { NewBpiRow, SortKey } from "./ui";

interface Props {
  userId: string;
}

/**
 * issue #299〜304 検証用: 自分のスコアで現行BPIと新方式BPI(分布ベース)を
 * 楽曲ごとに見比べるための集計ロジック。
 *
 * 新方式のパラメータ(mu/sigma)は `songParams.json`（DBに追加しない）から読む。
 */
export default function NewBpiComparison({ userId }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("deltaDesc");
  const { songs, isLoading: isSongsLoading } = useUserScores(
    userId,
    latestVersion,
  );
  const { stats, isLoading: isStatsLoading } = useTotalBpiStats(
    userId,
    latestVersion,
  );

  const { rows, newTotalBpi, comparableCount } = useMemo(() => {
    if (!songs) return { rows: [], newTotalBpi: null, comparableCount: 0 };

    const played = songs.filter(
      (s): s is typeof s & { exScore: number } => s.exScore !== null,
    );

    const rows: NewBpiRow[] = played.map((s) => {
      const hasParam = NewBpiCalculator.hasParams(s.songId);
      const newBpi = hasParam
        ? NewBpiCalculator.calc(s.exScore, s.songId, s.notes)
        : null;
      return {
        songId: s.songId,
        title: s.title,
        difficulty: s.difficulty,
        difficultyLevel: s.difficultyLevel,
        exScore: s.exScore,
        currentBpi: s.bpi,
        newBpi,
        delta: s.bpi !== null && newBpi !== null ? newBpi - s.bpi : null,
      };
    });

    // 新方式の総合BPI(参考値) = issue #304 の潜在スキル a_i を
    // 「パラメータのある楽曲かつプレイ済み」の範囲でこの場で直接推定する。
    let num = 0;
    let den = 0;
    let comparableCount = 0;
    for (const s of played) {
      const param = newBpiSongParamMap.get(s.songId);
      if (!param) continue;
      const m = s.notes * 2;
      const miss = Math.max(0.5, m - Math.min(s.exScore, m));
      const t = -Math.log(miss);
      num += param.sigma * (t - param.mu);
      den += param.sigma * param.sigma;
      comparableCount++;
    }
    const a = den > 0 ? num / den : null;
    const newTotalBpi =
      a !== null
        ? Math.round(
            100 * ((a - NEW_BPI_Z0) / (NEW_BPI_Z100 - NEW_BPI_Z0)) * 100,
          ) / 100
        : null;

    return { rows, newTotalBpi, comparableCount };
  }, [songs]);

  if (isSongsLoading || isStatsLoading) {
    return <PageLoader />;
  }

  return (
    <NewBpiComparisonUi
      rows={rows}
      sortKey={sortKey}
      onSortKeyChange={setSortKey}
      currentTotalBpi={stats?.totalBpi ?? null}
      newTotalBpi={newTotalBpi}
      comparableCount={comparableCount}
    />
  );
}
