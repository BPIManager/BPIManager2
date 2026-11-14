import { useRadar } from "@/hooks/stats/useRadar";
import { useStatsFilter } from "@/contexts/stats/FilterContext";
import FetchErrorState from "@/components/partials/common/ErrorStates/FetchErrorState";
import RadarSkeleton from "./skeleton";
import RadarSectionChart from "./index";
import { RadarCategory } from "@/types/stats/radar";
import { useMemo } from "react";
import { getBpiColorStyle } from "@/constants/theme/bpiColor";
import { DashCard } from "@/components/ui/dashcard";
import { cn } from "@/lib/utils";
import { getVersionNameFromNumber } from "@/constants/iidx/versionTitles";
import { useTranslation } from "@/hooks/common/useTranslation";
import { useRouter } from "next/router";
import { radarCategoryListQuery } from "@/utils/dashboard/scoreListLink";
import { clickableProps } from "@/utils/common/clickableProps";

interface RadarSectionProps {
  userId?: string;
  rivalUserId?: string;
  rivalName?: string;
  /** 自分のダッシュボードのみ true。カテゴリのツールチップに「対象曲一覧を表示」を出す */
  showListAction?: boolean;
}

const RadarSection = ({
  userId,
  rivalUserId,
  rivalName,
  showListAction = false,
}: RadarSectionProps) => {
  const router = useRouter();
  const { version, levels, diffs, compareVersion } = useStatsFilter();

  const isCompareMode = !rivalUserId && !!compareVersion;
  const effectiveRivalUserId =
    rivalUserId ?? (isCompareMode ? userId : undefined);
  const effectiveRivalVersion = rivalUserId ? version : compareVersion;
  const { t } = useTranslation();
  const effectiveRivalName = rivalUserId
    ? (rivalName ?? t("dashboard.rival"))
    : getVersionNameFromNumber(compareVersion);

  const { radar, isLoading, isError } = useRadar(userId, levels, diffs, version);
  const {
    radar: rivalRadar,
    isLoading: rivalLoading,
    isError: rivalError,
  } = useRadar(effectiveRivalUserId, levels, diffs, effectiveRivalVersion);

  const isRivalMode = !!effectiveRivalUserId;

  const goToList = (category: RadarCategory) =>
    router.push({
      pathname: `/my/${version}`,
      query: {
        ...radarCategoryListQuery(category),
        levels: levels.join(","),
        difficulties: diffs.join(","),
        page: "1",
      },
    });

  const sortedData = useMemo(() => {
    if (!radar) return [];
    return (Object.keys(radar) as RadarCategory[]).sort((a, b) => {
      return radar[b].totalBpi - radar[a].totalBpi;
    });
  }, [radar]);

  if (isLoading || (isRivalMode && rivalLoading)) return <RadarSkeleton />;
  if (isError || (isRivalMode && rivalError)) {
    return (
      <DashCard>
        <FetchErrorState error={isError || rivalError} />
      </DashCard>
    );
  }
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
          {t("dashboard.radar.title")}
        </h3>
        {isRivalMode && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-bpim-primary" />
              <span className="text-xs text-bpim-primary font-bold">
                {t("dashboard.radar.me")}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-orange-400" />
              <span className="text-xs text-bpim-warning font-bold">
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
                {...(showListAction ? clickableProps(() => goToList(key)) : {})}
                title={showListAction ? t("dashboard.distribution.showList") : undefined}
                className={cn(
                  "flex items-center justify-between p-2.5 rounded-md",
                  "bg-bpim-surface-2/60 border border-bpim-border transition-all duration-200",
                  showListAction &&
                    "cursor-pointer hover:bg-bpim-overlay hover:translate-x-1 hover:border-bpim-border",
                )}
              >
                <span className="text-xs font-bold text-bpim-text">{key}</span>

                <div className="flex items-center gap-2">
                  {isRivalMode && rivalBpi !== undefined && (
                    <div className="inline-flex min-w-16 items-center justify-center rounded-sm border border-orange-500/50 bg-orange-500/10 px-2 py-0.5 font-mono text-sm font-bold text-bpim-warning">
                      {rivalBpi.toFixed(2)}
                    </div>
                  )}
                  <div
                    className="inline-flex min-w-16 items-center justify-center rounded-sm border px-2 py-0.5 font-mono text-sm font-bold text-bpim-text"
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
    </DashCard>
  );
};

export default RadarSection;
