"use client";

import { useMemo } from "react";
import { useMultiRivalScores } from "@/hooks/social/useMultiRivalScores";
import { SectionLoader } from "@/components/ui/loading-spinner";
import { useTranslation } from "@/hooks/common/useTranslation";
import type { VirtualRivalKey } from "../PickStep/types";

interface Props {
  myUserId: string;
  myName?: string;
  rivalIds: string[];
  virtualKeys: VirtualRivalKey[];
  version: string;
}

interface PivotedRow {
  songId: number;
  title: string;
  difficulty: string;
  difficultyLevel: number;
  wrScore: number;
  kaidenAvg: number;
  exByUser: Record<string, number>;
}

/**
 * 複数ライバル(1:N)比較の基本スコア表(#287)。
 *
 * レーダー・BPM帯別分布・楽曲マトリックス等の本格的な可視化は別issue(#288)
 * で対応するため、ここでは`getMultiUserLatestScores`で取得した生データを
 * 楽曲×ユーザーの単純な表として表示するに留める。
 */
const MultiRivalScoreTable = ({
  myUserId,
  myName,
  rivalIds,
  virtualKeys,
  version,
}: Props) => {
  const { t } = useTranslation();
  const { scores, resolvedRivalIds, isLoading } = useMultiRivalScores(
    myUserId,
    rivalIds,
    version,
  );

  const userIds = useMemo(
    () => [myUserId, ...resolvedRivalIds],
    [myUserId, resolvedRivalIds],
  );

  const userNames = useMemo(() => {
    const map = new Map<string, string>();
    map.set(myUserId, myName ?? myUserId);
    for (const row of scores) {
      if (!map.has(row.userId)) map.set(row.userId, row.userName ?? row.userId);
    }
    return map;
  }, [scores, myUserId, myName]);

  const rows = useMemo(() => {
    const bySong = new Map<number, PivotedRow>();
    for (const row of scores) {
      let entry = bySong.get(row.songId);
      if (!entry) {
        entry = {
          songId: row.songId,
          title: row.title,
          difficulty: row.difficulty,
          difficultyLevel: row.difficultyLevel,
          wrScore: row.wrScore,
          kaidenAvg: row.kaidenAvg,
          exByUser: {},
        };
        bySong.set(row.songId, entry);
      }
      entry.exByUser[row.userId] = row.exScore;
    }
    return Array.from(bySong.values()).sort((a, b) =>
      a.title.localeCompare(b.title, "ja"),
    );
  }, [scores]);

  if (isLoading) return <SectionLoader className="py-10" />;

  if (rows.length === 0) {
    return (
      <p className="py-10 text-center text-sm font-medium text-bpim-muted">
        {t("rivals.analysis.noSongs")}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-bpim-border">
      <table className="w-full min-w-max border-collapse text-xs">
        <thead className="sticky top-0 bg-bpim-surface-2 text-bpim-muted">
          <tr>
            <th className="whitespace-nowrap px-3 py-2 text-left font-bold">
              {t("rivals.analysis.difficulty")}
            </th>
            {userIds.map((id) => (
              <th
                key={id}
                className="whitespace-nowrap px-3 py-2 text-right font-bold"
              >
                {userNames.get(id) ?? id}
              </th>
            ))}
            {virtualKeys.includes("wr") && (
              <th className="whitespace-nowrap px-3 py-2 text-right font-bold">
                {t("rivals.pickStep.wr")}
              </th>
            )}
            {virtualKeys.includes("kaidenAvg") && (
              <th className="whitespace-nowrap px-3 py-2 text-right font-bold">
                {t("rivals.pickStep.kaidenAvg")}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.songId}
              className="border-t border-bpim-border text-bpim-text"
            >
              <td className="whitespace-nowrap px-3 py-2">
                <span className="font-bold">{row.title}</span>
                <span className="ml-2 text-bpim-muted">
                  {row.difficulty} ☆{row.difficultyLevel}
                </span>
              </td>
              {userIds.map((id) => (
                <td key={id} className="whitespace-nowrap px-3 py-2 text-right font-mono">
                  {row.exByUser[id] ?? "-"}
                </td>
              ))}
              {virtualKeys.includes("wr") && (
                <td className="whitespace-nowrap px-3 py-2 text-right font-mono text-bpim-muted">
                  {row.wrScore}
                </td>
              )}
              {virtualKeys.includes("kaidenAvg") && (
                <td className="whitespace-nowrap px-3 py-2 text-right font-mono text-bpim-muted">
                  {row.kaidenAvg}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MultiRivalScoreTable;
