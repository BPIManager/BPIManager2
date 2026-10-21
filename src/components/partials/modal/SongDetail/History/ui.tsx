import type { ComponentProps } from "react";
import { versionTitles } from "@/constants/iidx/versionTitles";
import { Separator } from "@/components/ui/separator";
import { History } from "lucide-react";
import HistoryRecordCard from "@/components/partials/common/Songs/HistoryRecordCard";

type HistoryRecord = ComponentProps<typeof HistoryRecordCard>["record"];

interface SongHistoryViewProps {
  historyGroups: Record<string, HistoryRecord[]> | undefined;
  globalMaxScore: number;
  /** 全難易度スコア(BPI未計算)の場合に notes を渡す。BPIの代わりにnotes基準の%を表示する */
  notes?: number;
}

const SongHistoryView = ({
  historyGroups,
  globalMaxScore,
  notes,
}: SongHistoryViewProps) => {
  if (!historyGroups || Object.keys(historyGroups).length === 0)
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <History className="h-10 w-10 text-bpim-subtle" />
        <p className="text-sm font-bold text-bpim-muted">
          履歴データが見つかりません
        </p>
      </div>
    );

  const sortedVersions = Object.keys(historyGroups).sort(
    (a, b) => Number(b) - Number(a),
  );

  return (
    <div className="flex flex-col gap-6 max-h-[45svh] overflow-y-auto pr-2 custom-scrollbar">
      {sortedVersions.map((version) => {
        const records = historyGroups[version];
        const displayTitle =
          versionTitles.find((v) => v.num === version)?.title ??
          `Ver.${version}`;

        return (
          <div key={version} className="flex flex-col">
            <div className="mb-3 flex items-center gap-4 px-1">
              <span className="text-[10px] font-black tracking-widest text-bpim-muted uppercase">
                {displayTitle}
              </span>
              <Separator className="flex-1 bg-bpim-overlay/60" />
            </div>

            <div className="flex flex-col gap-2.5">
              {records.map((record, idx) => {
                const prev = records[idx + 1];
                return (
                  <HistoryRecordCard
                    key={record.logId}
                    record={record}
                    scoreDiff={prev ? record.exScore - prev.exScore : null}
                    isGlobalBest={
                      globalMaxScore > 0 && record.exScore === globalMaxScore
                    }
                    notes={notes}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SongHistoryView;
