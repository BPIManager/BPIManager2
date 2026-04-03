import { useRadar } from "@/hooks/stats/useRadar";
import { useStatsFilter } from "@/contexts/stats/FilterContext";
import { RadarSkeleton } from "./skeleton";
import { RadarSectionChart } from ".";
import { RadarCategory } from "@/types/stats/radar";
import { useMemo, useState } from "react";
import { RadarCategorySongsDialog } from "./dialog";
import { getBpiColorStyle } from "@/constants/bpiColor";
import { DashCard } from "@/components/ui/dashcard";
import { cn } from "@/lib/utils";
import { getVersionNameFromNumber } from "@/constants/versions";

interface RadarSectionProps {
  userId?: string;
  rivalUserId?: string;
  rivalName?: string;
}

export const RadarSection = ({
  userId,
  rivalUserId,
  rivalName,
}: RadarSectionProps) => {
  const { version, levels, diffs, compareVersion } = useStatsFilter();

  const isCompareMode = !rivalUserId && !!compareVersion;
  const effectiveRivalUserId =
    rivalUserId ?? (isCompareMode ? userId : undefined);
  const effectiveRivalVersion = rivalUserId ? version : compareVersion;
  const effectiveRivalName = rivalUserId
    ? (rivalName ?? "ライバル")
    : getVersionNameFromNumber(compareVersion);

  const { radar, isLoading } = useRadar(userId, levels, diffs, version);
  const { radar: rivalRadar, isLoading: rivalLoading } = useRadar(
    effectiveRivalUserId,
    levels,
    diffs,
    effectiveRivalVersion,
  );
  const [selectedCat, setSelectedCat] = useState<RadarCategory | null>(null);

  const isRivalMode = !!effectiveRivalUserId;

  const sortedData = useMemo(() => {
    if (!radar) return [];
    return (Object.keys(radar) as RadarCategory[]).sort((a, b) => {
      return radar[b].totalBpi - radar[a].totalBpi;
    });
  }, [radar]);

  if (isLoading || (isRivalMode && rivalLoading)) return <RadarSkeleton />;
  if (!radar) return null;

  const rivalDataFlat = rivalRadar
    ? Object.fromEntries(
        Object.entries(rivalRadar).map(([k, v]) => [k, v.totalBpi]),
      )
    : undefined;

  return (
    <DashCard>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-bpim-muted uppercase">
          BPIレーダー
        </h3>
        {isRivalMode && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-bpim-primary" />
              <span className="text-xs text-bpim-primary font-medium">
                自分
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-orange-400" />
              <span className="text-xs text-bpim-warning font-medium">
                {effectiveRivalName}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <RadarSectionChart data={radar} rivalData={rivalDataFlat} />

        <div className="flex flex-col gap-2">
          {sortedData.map((key) => {
            const bpi = radar[key].totalBpi;
            const rivalBpi = rivalRadar ? rivalRadar[key]?.totalBpi : undefined;
            const style = getBpiColorStyle(bpi);

            return (
              <div
                key={key}
                onClick={() => setSelectedCat(key)}
                className={cn(
                  "flex items-center justify-between p-2.5 rounded-md",
                  "bg-bpim-surface-2/60 border border-bpim-border cursor-pointer transition-all duration-200",
                  "hover:bg-bpim-overlay hover:translate-x-1 hover:border-bpim-border",
                )}
              >
                <span className="text-xs font-bold text-bpim-text">{key}</span>

                <div className="flex items-center gap-2">
                  {isRivalMode && rivalBpi !== undefined && (
                    <div className="inline-flex min-w-[64px] items-center justify-center rounded-sm border border-orange-500/50 bg-orange-500/10 px-2 py-0.5 font-mono text-sm font-bold text-bpim-warning">
                      {rivalBpi.toFixed(2)}
                    </div>
                  )}
                  <div
                    className="inline-flex min-w-[64px] items-center justify-center rounded-sm border px-2 py-0.5 font-mono text-sm font-bold text-bpim-text"
                    style={{
                      borderColor: style.bg,
                      backgroundColor: `${style.bg}15`,
                    }}
                  >
                    {bpi.toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedCat && (
        <RadarCategorySongsDialog
          categoryName={selectedCat}
          songs={radar[selectedCat].songs}
          isOpen={!!selectedCat}
          onClose={() => setSelectedCat(null)}
        />
      )}
    </DashCard>
  );
};
