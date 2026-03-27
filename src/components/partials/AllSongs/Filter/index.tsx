"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, Loader, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { AllDifficulties, AllScoreFilterParams } from "@/types/songs/allSongs";
import { FilterSelect } from "../../Songs/Filter/select";
import {
  FilterCheckboxGroup,
  FilterStickyToggle,
} from "../../Songs/Filter/part";
import { ALL_DIFFICULTIES, ALL_LEVELS } from "@/constants/levels";
import { useDebouncedSearch } from "@/hooks/common/useDebouncedSearch";
import { toggleArrayItem } from "@/hooks/common/useToggleArray";

const SORT_OPTIONS = [
  { label: "レベル", value: "level" },
  { label: "タイトル", value: "title" },
  { label: "EXスコア", value: "exScore" },
  { label: "スコアレート", value: "scoreRate" },
  { label: "最終プレイ", value: "updatedAt" },
];
const SORT_ORDER_OPTIONS = [
  { label: "降順", value: "desc" },
  { label: "昇順", value: "asc" },
];

interface AllSongFilterBarProps {
  params: AllScoreFilterParams;
  onParamsChange: (p: Partial<AllScoreFilterParams>) => void;
  totalCount: number;
}

export const AllSongFilterBar = ({
  params,
  onParamsChange,
  totalCount,
}: AllSongFilterBarProps) => {
  const [isSticky, setIsSticky] = useState(true);
  const { localSearch, setLocalSearch, isTyping } = useDebouncedSearch(
    params.search || "",
    (val) => onParamsChange({ search: val }),
  );

  return (
    <div
      className={cn(
        "px-4 pt-4 pb-2 border-b border-bpim-border transition-all duration-200 w-full",
        isSticky ? "sticky top-0 z-50 bg-bpim-bg" : "relative bg-bpim-bg",
      )}
    >
      <div className="flex w-full gap-2 mb-3 flex-wrap">
        <FilterSelect
          value={params.sortKey || "level"}
          onValueChange={(val) =>
            onParamsChange({ sortKey: val as AllScoreFilterParams["sortKey"] })
          }
          options={SORT_OPTIONS}
          placeholder="ソート"
          className="flex-1 min-w-[110px]"
        />
        <FilterSelect
          value={params.sortOrder || "desc"}
          onValueChange={(val) =>
            onParamsChange({ sortOrder: val as "asc" | "desc" })
          }
          options={SORT_ORDER_OPTIONS}
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
      </div>

      <div className="flex gap-4 flex-wrap items-start">
        <FilterCheckboxGroup
          label="LEVEL"
          items={ALL_LEVELS}
          selected={params.levels}
          onToggle={(lv) =>
            onParamsChange({
              levels: toggleArrayItem(params.levels, lv),
            })
          }
          getLabel={(v) => v}
        />
        <FilterCheckboxGroup
          label="DIFFICULTY"
          items={ALL_DIFFICULTIES}
          selected={params.difficulties}
          onToggle={(v) =>
            onParamsChange({
              difficulties: toggleArrayItem(params.difficulties, v),
            })
          }
          getLabel={(v) => v[0]}
        />
      </div>

      <div className="flex items-center justify-between h-6 mt-2">
        <span className="text-xs font-bold text-bpim-text leading-none">
          {totalCount.toLocaleString()}曲
        </span>
        <FilterStickyToggle isSticky={isSticky} onToggle={setIsSticky} />
      </div>
    </div>
  );
};
