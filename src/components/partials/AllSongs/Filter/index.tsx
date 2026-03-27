"use client";

import { AllScoreFilterParams } from "@/types/songs/allSongs";
import {
  FilterBarContainer,
  FilterCheckboxGroup,
  FilterSearchInput,
} from "../../Songs/Filter/part";
import { FilterSelect } from "../../Songs/Filter/select";
import { ALL_DIFFICULTIES, ALL_LEVELS } from "@/constants/levels";
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
}: AllSongFilterBarProps) => (
  <FilterBarContainer totalCount={totalCount}>
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
      <FilterSearchInput
        value={params.search || ""}
        onChange={(val) => onParamsChange({ search: val })}
      />
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
  </FilterBarContainer>
);
