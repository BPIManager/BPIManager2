"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

import {
  rivalSortOptions,
  soleSortOptions,
  sortOptions,
} from "@/constants/sort";
import { FilterParamsFrontend } from "@/types/songs/withScore";
import { versionsNonDisabledCollection } from "@/constants/versions";
import { latestVersion } from "@/constants/latestVersion";
import { FilterCheckboxGroup, FilterStickyToggle } from "./part";
import { cn } from "@/lib/utils";
import { FilterSelect } from "./select";
import { Search, Loader, SlidersHorizontal } from "lucide-react";

interface SongFilterBarProps {
  params: FilterParamsFrontend;
  onParamsChange: (params: Partial<FilterParamsFrontend>) => void;
  onOpenAdvancedFilter: () => void;
  totalCount: number;
  disableVersionSelect?: boolean;
  withRivals?: "full" | "score-only" | false;
}

export const SongFilterBar = ({
  params,
  onParamsChange,
  onOpenAdvancedFilter,
  totalCount,
  disableVersionSelect,
  withRivals,
}: SongFilterBarProps) => {
  const router = useRouter();
  const [isSticky, setIsSticky] = useState(true);

  const [localSearch, setLocalSearch] = useState(params.search || "");
  const isTyping = localSearch !== (params.search || "");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== (params.search || "")) {
        onParamsChange({ search: localSearch });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch, onParamsChange, params.search]);

  useEffect(() => {
    setLocalSearch(params.search || "");
  }, [params.search]);

  const toggleArrayItem = <T,>(current: T[] | undefined, item: T) => {
    const list = current || [];
    return list.includes(item)
      ? list.filter((i) => i !== item)
      : [...list, item];
  };

  const currentStoreVersion = router.query.version;

  const combinedSortOptions = useMemo(() => {
    return withRivals
      ? [...sortOptions, ...rivalSortOptions]
      : [...soleSortOptions, ...sortOptions];
  }, [withRivals]);

  return (
    <div
      className={cn(
        "px-4 py-2 border-b border-bpim-border transition-all duration-200 w-full",
        isSticky ? "sticky top-0 z-50 bg-bpim-bg" : "relative bg-bpim-bg",
      )}
    >
      <div className="flex w-full gap-2 mb-3">
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
            className="flex-1"
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
          placeholder="Sort by"
          className="flex-1"
        />
      </div>

      <div className="flex w-full gap-2 items-center mb-3">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-bpim-muted">
            <Search size={16} />
          </div>
          <Input
            placeholder="曲名で検索..."
            className="h-9 pl-10 pr-10 border-bpim-border bg-bpim-surface-2/60 focus-visible:ring-gray-500 text-sm"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
          {isTyping && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader className="animate-spin text-bpim-text" size={14} />
            </div>
          )}
        </div>
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
