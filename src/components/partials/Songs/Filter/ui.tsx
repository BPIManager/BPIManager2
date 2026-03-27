"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  rivalSortOptions,
  soleSortOptions,
  sortOptions,
  sortOrderOptions,
} from "@/constants/sort";
import { FilterParamsFrontend } from "@/types/songs/withScore";
import { versionsNonDisabledCollection } from "@/constants/versions";
import { latestVersion } from "@/constants/latestVersion";
import { FilterCheckboxGroup, FilterStickyToggle } from "./part";
import { cn } from "@/lib/utils";
import { FilterSelect } from "./select";
import { Search, Loader, SlidersHorizontal } from "lucide-react";
import { useDebouncedSearch } from "@/hooks/common/useDebouncedSearch";
import { toggleArrayItem } from "@/hooks/common/useToggleArray";

interface SongFilterBarProps {
  params: FilterParamsFrontend;
  onParamsChange: (params: Partial<FilterParamsFrontend>) => void;
  onOpenAdvancedFilter: () => void;
  totalCount: number;
  disableVersionSelect?: boolean;
  withRivals?: "full" | "score-only" | false;
  withSelfCompare?: boolean;
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
  currentVersion,
}: SongFilterBarProps) => {
  const router = useRouter();
  const [isSticky, setIsSticky] = useState(true);
  const { localSearch, setLocalSearch, isTyping } = useDebouncedSearch(
    params.search || "",
    (val) => onParamsChange({ search: val }),
  );

  const currentStoreVersion = router.query.version;

  const compareVersionOptions = useMemo(() => {
    const base = versionsNonDisabledCollection.filter(
      (v) =>
        v.value !==
        (currentVersion ?? String(currentStoreVersion ?? latestVersion)),
    );
    return [{ label: "比較なし", value: "none" }, ...base];
  }, [currentVersion, currentStoreVersion]);

  const hasCompare = params.compareVersion && params.compareVersion !== "none";

  const combinedSortOptions = useMemo(() => {
    const base = withRivals
      ? [...sortOptions, ...rivalSortOptions]
      : [...soleSortOptions, ...sortOptions];
    if (hasCompare) return [...base];
    return base;
  }, [withRivals, hasCompare]);

  return (
    <div
      className={cn(
        "px-4 pt-4 pb-2 border-b border-bpim-border transition-all duration-200 w-full",
        isSticky ? "sticky top-0 z-50 bg-bpim-bg" : "relative bg-bpim-bg",
      )}
    >
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
            className="flex-1 min-w-[110px]"
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
          placeholder="ソート"
          className="flex-1 min-w-[110px]"
        />
        <FilterSelect
          value={params.sortOrder || "desc"}
          onValueChange={(val) =>
            onParamsChange({ sortOrder: val as "asc" | "desc" })
          }
          options={sortOrderOptions}
          placeholder="順序"
          className="w-[90px] shrink-0"
        />
      </div>
      <div className="flex w-full gap-2 items-center mb-3">
        <div className="relative flex-1 h-9">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-bpim-muted pointer-events-none">
            <Search size={16} />
          </div>
          <Input
            placeholder="曲名で検索..."
            className="h-9 pl-10 pr-10 border-bpim-border bg-bpim-surface-2/60 text-xs focus-visible:ring-gray-500"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
          {isTyping && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader className="animate-spin text-bpim-text" size={14} />
            </div>
          )}
        </div>

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
              placeholder="比較表示"
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
          onToggle={(v: any) =>
            onParamsChange({ levels: toggleArrayItem(params.levels, v) })
          }
          getLabel={(v: any) => `☆${v}`}
        />
        <FilterCheckboxGroup
          label="DIFFICULTY"
          items={["HYPER", "ANOTHER", "LEGGENDARIA"]}
          selected={params.difficulties}
          onToggle={(v: any) =>
            onParamsChange({
              difficulties: toggleArrayItem(params.difficulties, v),
            })
          }
          getLabel={(v: any) => v[0]}
        />
      </div>

      {withRivals === "full" && (
        <div className="flex gap-6 flex-wrap mt-3 pt-3 border-t border-bpim-border">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
              プレイ状態
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
                  自分プレイ済
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
                  ライバルプレイ済
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between h-6 mt-2">
        <span className="text-xs font-bold text-bpim-text leading-none">
          {totalCount.toLocaleString()}曲
        </span>
        <FilterStickyToggle isSticky={isSticky} onToggle={setIsSticky} />
      </div>
    </div>
  );
};
