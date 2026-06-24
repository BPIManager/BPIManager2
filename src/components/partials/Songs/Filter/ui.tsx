"use client";

import { useMemo } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  rivalSortOptions,
  scoreRateSortOption,
  soleSortOptions,
  sortOptions,
  sortOrderOptions,
} from "@/constants/ui/sort";
import { FilterParamsFrontend } from "@/types/songs/score";
import { versionsNonDisabledCollection } from "@/constants/iidx/versionTitles";
import { IIDX_DIFFICULTIES } from "@/constants/iidx/bpiDifficulties";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import {
  FilterBarContainer,
  FilterCheckboxGroup,
  FilterSearchInput,
} from "./part";
import { FilterSelect } from "./select";
import { SlidersHorizontal } from "lucide-react";
import { toggleArrayItem } from "@/hooks/common/useToggleArray";
import { useTranslation } from "@/hooks/common/useTranslation";
import { type TranslationKey } from "@/lib/i18n/translations";

interface SongFilterBarProps {
  params: FilterParamsFrontend;
  onParamsChange: (params: Partial<FilterParamsFrontend>) => void;
  onOpenAdvancedFilter: () => void;
  totalCount: number;
  disableVersionSelect?: boolean;
  withRivals?: "full" | "score-only" | false;
  withSelfCompare?: boolean;
  withScoreRate?: boolean;
  currentVersion?: string;
}

export const SongFilterBar = ({
  params,
  onParamsChange,
  onOpenAdvancedFilter,
  totalCount,
  disableVersionSelect,
  withRivals,
  withSelfCompare = false,
  withScoreRate = false,
  currentVersion,
}: SongFilterBarProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const currentStoreVersion = router.query.version;

  const translateOpts = (opts: { label: string; value: string }[]) =>
    opts.map((o) => ({ ...o, label: t(`sort.${o.value}` as TranslationKey) }));

  const compareVersionOptions = useMemo(() => {
    const base = versionsNonDisabledCollection.filter(
      (v) =>
        v.value !==
        (currentVersion ?? String(currentStoreVersion ?? latestVersion)),
    );
    return [{ label: t("filter.noCompare"), value: "none" }, ...base];
  }, [currentVersion, currentStoreVersion, t]);

  const hasCompare = params.compareVersion && params.compareVersion !== "none";

  const combinedSortOptions = useMemo(() => {
    const base = withRivals
      ? [...translateOpts(sortOptions), ...translateOpts(rivalSortOptions)]
      : [
          ...translateOpts(soleSortOptions),
          ...(withScoreRate ? translateOpts([scoreRateSortOption]) : []),
          ...translateOpts(sortOptions),
        ];
    if (hasCompare) return [...base];
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withRivals, withScoreRate, hasCompare, t]);

  return (
    <FilterBarContainer totalCount={totalCount}>
      <div className="flex w-full gap-2 mb-3 flex-wrap">
        {!disableVersionSelect && (
          <FilterSelect
            value={String(currentStoreVersion ?? latestVersion)}
            onValueChange={(newVersion) => {
              router.push({
                pathname: router.pathname,
                query: { ...router.query, version: newVersion },
              });
            }}
            options={versionsNonDisabledCollection}
            placeholder="Version"
            className="flex-1 min-w-27.5"
          />
        )}
        <FilterSelect
          value={params.sortKey || "bpi"}
          onValueChange={(val) =>
            onParamsChange({
              sortKey: val as FilterParamsFrontend["sortKey"],
            })
          }
          options={combinedSortOptions}
          placeholder={t("filter.sort")}
          className="flex-1 min-w-27.5"
        />
        <FilterSelect
          value={params.sortOrder || "desc"}
          onValueChange={(val) =>
            onParamsChange({ sortOrder: val as "asc" | "desc" })
          }
          options={sortOrderOptions.map((o) => ({
            ...o,
            label: t(`sort.${o.value}` as TranslationKey),
          }))}
          placeholder={t("filter.order")}
          className="w-22.5 shrink-0"
        />
      </div>

      <div className="flex w-full gap-2 items-center mb-3">
        <FilterSearchInput
          value={params.search || ""}
          onChange={(val) => onParamsChange({ search: val })}
        />
        {withSelfCompare && (
          <div className="relative flex-1 h-9">
            <FilterSelect
              value={params.compareVersion || ""}
              onValueChange={(val) =>
                onParamsChange({
                  compareVersion: val === "none" ? undefined : val,
                })
              }
              options={compareVersionOptions}
              placeholder={t("filter.compareVersion")}
              className="h-9"
            />
          </div>
        )}
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0 border-bpim-border hover:bg-bpim-overlay"
          onClick={onOpenAdvancedFilter}
        >
          <SlidersHorizontal size={18} />
        </Button>
      </div>

      <div className="flex gap-6 flex-wrap items-center">
        <FilterCheckboxGroup
          label="LEVEL"
          items={[11, 12]}
          selected={params.levels}
          onToggle={(v) =>
            onParamsChange({ levels: toggleArrayItem(params.levels, v) })
          }
          getLabel={(v) => `☆${v}`}
        />
        <FilterCheckboxGroup
          label="DIFFICULTY"
          items={IIDX_DIFFICULTIES}
          selected={params.difficulties}
          onToggle={(v) =>
            onParamsChange({
              difficulties: toggleArrayItem(params.difficulties, v),
            })
          }
          getLabel={(v) => v[0]}
        />
      </div>

      {withRivals === "full" && (
        <div className="flex gap-6 flex-wrap mt-3 pt-3 border-t border-bpim-border">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
              {t("filter.playState")}
            </span>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer group">
                <Checkbox
                  checked={params.isMyPlayed}
                  onCheckedChange={(checked) =>
                    onParamsChange({ isMyPlayed: !!checked })
                  }
                />
                <span className="text-xs font-bold text-bpim-text group-hover:text-bpim-text transition-colors">
                  {t("filter.myPlayed")}
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <Checkbox
                  checked={params.isRivalPlayed}
                  onCheckedChange={(checked) =>
                    onParamsChange({ isRivalPlayed: !!checked })
                  }
                />
                <span className="text-xs font-bold text-bpim-text group-hover:text-bpim-text transition-colors">
                  {t("filter.rivalPlayed")}
                </span>
              </label>
            </div>
          </div>
        </div>
      )}
    </FilterBarContainer>
  );
};
