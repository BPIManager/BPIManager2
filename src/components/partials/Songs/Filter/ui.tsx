"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { LuLoader, LuSearch, LuSlidersHorizontal } from "react-icons/lu";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface SongFilterBarProps {
  params: FilterParamsFrontend;
  onParamsChange: (params: Partial<FilterParamsFrontend>) => void;
  onOpenAdvancedFilter: () => void;
  totalCount: number;
  disableVersionSelect?: boolean;
  withRivals?: boolean;
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
    const isRivalPage = router.pathname.includes("/rivals/");
    return isRivalPage
      ? [...sortOptions, ...rivalSortOptions]
      : [...soleSortOptions, ...sortOptions];
  }, [router.pathname]);

  return (
    <div
      className={cn(
        "p-4 border-b border-bpim-border transition-all duration-200 w-full",
        // bg-bpim-bg を確実に指定。
        // shadow-2xl をつけることで、重なっている境界をはっきりさせます。
        isSticky
          ? "sticky top-0 z-50 bg-bpim-bg shadow-2xl"
          : "relative bg-bpim-bg",
      )}
    >
      <div className="flex flex-col sm:flex-row w-full gap-2 mb-3 items-center">
        {!disableVersionSelect && (
          <div className="w-full sm:flex-1">
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
            />
          </div>
        )}
        <div className="w-full sm:flex-1">
          <FilterSelect
            value={params.sortKey || "bpi"}
            onValueChange={(val) =>
              onParamsChange({
                sortKey: val as FilterParamsFrontend["sortKey"],
              })
            }
            options={combinedSortOptions}
            placeholder="Sort by"
          />
        </div>
      </div>

      <div className="flex w-full gap-2 items-center mb-3">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            <LuSearch size={16} />
          </div>
          <Input
            placeholder="曲名で検索..."
            className="h-9 pl-10 pr-10 border-bpim-border bg-white/5 focus-visible:ring-gray-500 text-sm"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
          {isTyping && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <LuLoader className="animate-spin text-bpim-text" size={14} />
            </div>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 border-bpim-border hover:bg-white/10"
          onClick={onOpenAdvancedFilter}
        >
          <LuSlidersHorizontal size={18} />
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

      {withRivals && (
        <div className="flex gap-6 flex-wrap mt-3 pt-3 border-t border-bpim-border">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
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
                <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">
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
                <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">
                  ライバルプレイ済
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      <Separator className="bg-white/10 mt-3 mb-2" />

      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-bpim-text">
          {totalCount.toLocaleString()}曲
        </span>
        <FilterStickyToggle isSticky={isSticky} onToggle={setIsSticky} />
      </div>
    </div>
  );
};
