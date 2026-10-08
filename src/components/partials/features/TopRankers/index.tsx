"use client";

import { useRouter } from "next/router";
import { useMemo, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TOP_RANKER_VERSIONS } from "@/constants/iidx/topRankerAreas";
import { getVersionNameFromNumber } from "@/constants/iidx/versionTitles";
import { useTopRankersSummary } from "@/hooks/topRankers/useTopRankers";
import { useTranslation } from "@/hooks/common/useTranslation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import FetchErrorState from "@/components/partials/common/ErrorStates/FetchErrorState";
import SummaryTable from "./SummaryTable";
import TopRankersList from "./List";
import { summarizeByArea } from "./summary";

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

  const handleVersionChange = (next: string) => {
    router.push(
      { pathname: `/users/${userId}/top-rankers/${next}` },
      undefined,
      { shallow: true },
    );
  };

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
        <h2 className="mb-3 text-sm font-bold text-bpim-text">
          {t("topRankers.summary.title")}
        </h2>
        <SummaryTable
          rows={rows}
          currentVersion={version}
          onSelectVersion={(next) => {
            handleVersionChange(next);
            listRef.current?.scrollIntoView({ behavior: "smooth" });
          }}
        />
      </section>

      <section ref={listRef} className={`${sectionClass} flex flex-col gap-4`}>
        <div className="flex items-center gap-3">
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
        </div>
        <TopRankersList userId={userId} version={version} />
      </section>
    </div>
  );
};

export default TopRankersContent;
