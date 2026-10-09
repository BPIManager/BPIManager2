"use client";

import { useRouter } from "next/router";
import { HelpCircle } from "lucide-react";
import { useMemo, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TOP_RANKER_VERSIONS,
  getTopRankerAreaName,
} from "@/constants/iidx/topRankerAreas";
import { getVersionNameFromNumber } from "@/constants/iidx/versionTitles";
import { useTopRankersSummary } from "@/hooks/topRankers/useTopRankers";
import { useTranslation } from "@/hooks/common/useTranslation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import FetchErrorState from "@/components/partials/common/ErrorStates/FetchErrorState";
import SummaryTable from "./SummaryTable";
import TopRankersList from "./List";
import { areasInVersion, summarizeByArea } from "./summary";

const sectionClass =
  "rounded-2xl border border-bpim-border bg-bpim-bg/40 p-4 md:p-6 shadow-xl backdrop-blur-md";

const TopRankersContent = ({
  userId,
  version,
}: {
  userId: string;
  version: string;
}) => {
  const router = useRouter();
  const { t } = useTranslation();
  const { summary, error, isLoading } = useTopRankersSummary(userId);

  const listRef = useRef<HTMLElement>(null);
  const rows = useMemo(() => summarizeByArea(summary?.counts ?? []), [summary]);

  // 同じバージョンに全国と県別の両方があるため、一覧は選択中の1エリア分だけを出す。
  // `area`クエリが無い/データの無いエリアなら、そのバージョンで1位が最も多いエリアにする
  const versionAreas = useMemo(
    () => areasInVersion(summary?.counts ?? [], version),
    [summary, version],
  );
  const requestedArea = Number(router.query.area);
  const areaId = versionAreas.some((a) => a.areaId === requestedArea)
    ? requestedArea
    : (versionAreas[0]?.areaId ?? null);

  const go = (nextVersion: string, nextArea?: number) => {
    router.push(
      {
        pathname: `/users/${userId}/top-rankers/${nextVersion}`,
        query: nextArea === undefined ? {} : { area: nextArea },
      },
      undefined,
      { shallow: true },
    );
  };
  // バージョンだけ切り替えるときは、選択中のエリアを引き継ぐ（無ければ既定のエリアになる）
  const handleVersionChange = (next: string) => go(next, areaId ?? undefined);
  const handleAreaChange = (next: string) => go(version, Number(next));

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }
  if (error || !summary) return <FetchErrorState error={error} />;

  if (!summary.hasIidxId) {
    return (
      <p className={`${sectionClass} text-center text-sm text-bpim-muted`}>
        {t("topRankers.noIidxId")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <section className={sectionClass}>
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-bpim-text">
          {t("topRankers.summary.title")}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={t("topRankers.help.source")}
                  className="text-bpim-muted transition-colors duration-200 hover:text-bpim-text"
                >
                  <HelpCircle className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="max-w-72 flex-col items-start gap-1.5 text-left font-normal"
              >
                {(
                  [
                    "topRankers.help.source",
                    "topRankers.help.matching",
                    "topRankers.help.duplicate",
                    "topRankers.help.notShown",
                  ] as const
                ).map((key) => (
                  <span key={key} className="block">
                    ・{t(key)}
                  </span>
                ))}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </h2>
        <SummaryTable
          rows={rows}
          currentVersion={version}
          currentAreaId={areaId}
          onSelectVersion={(nextVersion, nextArea) => {
            go(nextVersion, nextArea);
            listRef.current?.scrollIntoView({ behavior: "smooth" });
          }}
        />
      </section>

      <section ref={listRef} className={`${sectionClass} flex flex-col gap-4`}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-bpim-muted">
            {t("topRankers.version.label")}
          </span>
          <Select value={version} onValueChange={handleVersionChange}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[...TOP_RANKER_VERSIONS].reverse().map((v) => (
                <SelectItem key={v} value={v}>
                  {getVersionNameFromNumber(v)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs font-bold text-bpim-muted">
            {t("topRankers.area.label")}
          </span>
          <Select
            value={areaId === null ? "" : String(areaId)}
            onValueChange={handleAreaChange}
            disabled={versionAreas.length === 0}
          >
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {versionAreas.map((a) => (
                <SelectItem key={a.areaId} value={String(a.areaId)}>
                  {getTopRankerAreaName(a.areaId)} ({a.count}
                  {t("topRankers.summary.unit")})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {areaId === null ? (
          <p className="py-6 text-center text-sm text-bpim-muted">
            {t("topRankers.list.empty")}
          </p>
        ) : (
          <TopRankersList userId={userId} version={version} areaId={areaId} />
        )}
      </section>
    </div>
  );
};

export default TopRankersContent;
