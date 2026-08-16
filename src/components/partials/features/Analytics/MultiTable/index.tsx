"use client";

import { SectionLoader } from "@/components/ui/loading-spinner";
import FetchErrorState from "@/components/partials/common/ErrorStates/FetchErrorState";
import { useTranslation } from "@/hooks/common/useTranslation";
import { targetKey } from "@/hooks/analytics/resolveMultiTargets";
import type { SongWithMultiTargets } from "@/hooks/analytics/useMultiAnalyticsComparison";
import type { AnalyticsTarget } from "@/types/analytics";

interface Props {
  songs: SongWithMultiTargets[] | undefined;
  targets: AnalyticsTarget[];
  isLoading: boolean;
  error: Error | undefined;
}

/**
 * 複数ターゲット選択時の「楽曲一覧」タブの最低限の表示(#287)。
 *
 * 楽曲×ターゲットの本格的なマトリックス表示(ハイライト・既存フィルタとの
 * 連携等)は#288で行うため、ここでは選択した各ターゲットのEXスコアを
 * 確認できる単純な表に留める。
 */
const AnalyticsMultiComparisonTable = ({
  songs,
  targets,
  isLoading,
  error,
}: Props) => {
  const { t } = useTranslation();

  if (error) return <FetchErrorState error={error} />;
  if (isLoading || !songs) return <SectionLoader className="py-16" />;
  if (songs.length === 0) {
    return (
      <p className="py-16 text-center text-sm font-medium text-bpim-muted">
        {t("rivals.analysis.noSongs")}
      </p>
    );
  }

  const sorted = [...songs].sort((a, b) => a.title.localeCompare(b.title, "ja"));

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max border-collapse text-xs">
        <thead className="sticky top-0 bg-bpim-surface-2 text-bpim-muted">
          <tr>
            <th className="whitespace-nowrap px-3 py-2 text-left font-bold">
              {t("rivals.analysis.difficulty")}
            </th>
            <th className="whitespace-nowrap px-3 py-2 text-right font-bold">
              {t("page.rival.me")}
            </th>
            {targets.map((target) => (
              <th
                key={targetKey(target)}
                className="whitespace-nowrap px-3 py-2 text-right font-bold"
              >
                {target.label || target.kind}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((song) => (
            <tr
              key={`${song.songId}-${song.difficulty}`}
              className="border-t border-bpim-border text-bpim-text"
            >
              <td className="whitespace-nowrap px-3 py-2">
                <span className="font-bold">{song.title}</span>
                <span className="ml-2 text-bpim-muted">
                  {song.difficulty} ☆{song.difficultyLevel}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-right font-mono">
                {song.exScore ?? "-"}
              </td>
              {targets.map((target) => (
                <td
                  key={targetKey(target)}
                  className="whitespace-nowrap px-3 py-2 text-right font-mono text-bpim-muted"
                >
                  {song.targets[targetKey(target)]?.exScore ?? "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AnalyticsMultiComparisonTable;
