"use client";

import { useCallback, useMemo, useState } from "react";
import { List } from "react-window";
import type { RowComponentProps } from "react-window";
import { useRouter } from "next/router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterCheckboxGroup } from "@/components/partials/common/ListControls/FilterControls";
import FetchErrorState from "@/components/partials/common/ErrorStates/FetchErrorState";
import RivalComparisonModal from "@/components/partials/modal/RivalComparison";
import { ALL_DIFFICULTIES, ALL_LEVELS } from "@/constants/iidx/songLevels";
import {
  NATIONWIDE_AREA_ID,
  TOP_RANKER_AREA_NAMES,
} from "@/constants/iidx/topRankerAreas";
import { toggleArrayItem } from "@/hooks/common/useToggleArray";
import { useTopRankersRanking } from "@/hooks/stats/useTopRankersRanking";
import { useTranslation } from "@/hooks/common/useTranslation";
import type { TopRankersRankingEntry } from "@/types/users/ranking";
import TopRankersRankingRow from "./row";

const ITEM_SIZE = 58;

interface RowData {
  rankings: TopRankersRankingEntry[];
  onRowClick: (userId: string) => void;
}

const VirtualRow = ({
  index,
  style,
  ariaAttributes,
  rankings,
  onRowClick,
}: RowComponentProps<RowData>) => (
  <div
    style={{
      ...style,
      paddingLeft: 8,
      paddingRight: 8,
      paddingTop: 3,
      paddingBottom: 3,
    }}
    {...ariaAttributes}
  >
    <TopRankersRankingRow entry={rankings[index]} onClick={onRowClick} />
  </div>
);

const csvNumbers = (v: unknown): number[] =>
  typeof v === "string" && v !== "" ? v.split(",").map(Number) : [];
const csvStrings = (v: unknown): string[] =>
  typeof v === "string" && v !== "" ? v.split(",") : [];

/** 県別（トップランカー）の1位保持数ランキング。エリアとレベル・難易度で数える譜面を絞れる */
const TopRankersRanking = ({ version }: { version: string }) => {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const area = (router.query.area as string) || String(NATIONWIDE_AREA_ID);
  const levels = csvNumbers(router.query.levels);
  const difficulties = csvStrings(router.query.difficulties);

  const { data, isLoading, isError } = useTopRankersRanking({
    version,
    area,
    levels,
    difficulties,
  });

  const pushQuery = (patch: Record<string, string | undefined>) => {
    router.push(
      { query: { ...router.query, ...patch } },
      undefined,
      { shallow: true },
    );
  };

  const handleRowClick = useCallback((userId: string) => {
    setSelectedUserId(userId);
    setIsModalOpen(true);
  }, []);

  const rankings = useMemo(() => data?.rankings ?? [], [data?.rankings]);
  const rowProps: RowData = useMemo(
    () => ({ rankings, onRowClick: handleRowClick }),
    [rankings, handleRowClick],
  );
  const selfRank = data?.selfRank ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
          {t("ranking.filter.area")}
        </label>
        <Select value={area} onValueChange={(v) => pushQuery({ area: v })}>
          <SelectTrigger className="h-9 w-full border-bpim-border bg-bpim-bg text-bpim-text focus:ring-blue-500">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-bpim-border bg-bpim-bg text-bpim-text">
            {TOP_RANKER_AREA_NAMES.map((name, areaId) => (
              <SelectItem key={areaId} value={String(areaId)}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <FilterCheckboxGroup
          label="LEVEL"
          items={ALL_LEVELS}
          selected={levels}
          onToggle={(lv) =>
            pushQuery({
              levels: toggleArrayItem(levels, lv).join(",") || undefined,
            })
          }
          getLabel={(lv) => `☆${lv}`}
        />
        <FilterCheckboxGroup
          label="DIFFICULTY"
          items={ALL_DIFFICULTIES}
          selected={difficulties}
          onToggle={(d) =>
            pushQuery({
              difficulties:
                toggleArrayItem(difficulties, d).join(",") || undefined,
            })
          }
          getLabel={(d) => d[0]}
        />
      </div>

      {selfRank > 0 && (
        <div className="rounded-xl border border-bpim-muted/20 bg-bpim-overlay/40 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-md text-bpim-muted">
              {t("ranking.selfRank.outOf")}
              {data?.totalCount ?? 0}
              {t("ranking.selfRank.people")}
            </p>
            <div className="text-right">
              <span className="text-xs text-bpim-muted">
                {t("ranking.selfRank.label")}
              </span>
              <div className="font-mono text-xl font-bold text-bpim-text">
                <span className="text-bpim-primary">{selfRank}</span>
                <span className="ml-0.5 text-sm">
                  {t("ranking.selfRank.suffix")}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-13 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <FetchErrorState error={isError} />
      ) : rankings.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl border border-bpim-border py-12 text-sm text-bpim-muted">
          {t("ranking.topRankers.noData")}
        </div>
      ) : (
        <List
          rowComponent={VirtualRow}
          rowCount={rankings.length}
          rowHeight={ITEM_SIZE}
          rowProps={rowProps}
          defaultHeight={500}
          overscanCount={5}
          className="rounded-xl border border-bpim-border"
          style={{ height: "calc(100svh - 520px)", minHeight: "300px" }}
        />
      )}

      {selectedUserId && (
        <RivalComparisonModal
          rivalId={selectedUserId}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          viewerRadar={data?.viewerRadar ?? {}}
        />
      )}
    </div>
  );
};

export default TopRankersRanking;
