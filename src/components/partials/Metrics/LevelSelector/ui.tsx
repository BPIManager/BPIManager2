"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { versionsNonDisabledCollection } from "@/constants/versions";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus } from "lucide-react";

const RANKS = ["A1", "A2", "A3", "A4", "A5"] as const;

const METRICS = [
  { label: "スコア", value: "score" },
  { label: "スコアレート", value: "scoreRate" },
  { label: "DJRANK", value: "djrank" },
] as const;

const DJRANK_OPTIONS = [
  "MAX-",
  "AAA",
  "AA",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
] as const;

export type DetailFilterMetric = "score" | "scoreRate" | "djrank";
export type DetailFilterOperator = ">=" | "<=";

export interface DetailFilter {
  id: string;
  rank: string;
  metric: DetailFilterMetric;
  operator: DetailFilterOperator;
  value: string;
}

interface ArenaAverageFilterProps {
  version: string;
  onVersionChange: (value: string) => void;
  level: string;
  onLevelChange: (value: string) => void;
  selectedDifficulties: Set<string>;
  onDifficultiesChange: (diffs: Set<string>) => void;
  nameSearch: string;
  onNameSearchChange: (search: string) => void;
  detailFilters: DetailFilter[];
  onDetailFiltersChange: (filters: DetailFilter[]) => void;
}

export const ArenaAverageFilter = ({
  version,
  onVersionChange,
  level,
  onLevelChange,
  selectedDifficulties,
  onDifficultiesChange,
  nameSearch,
  onNameSearchChange,
  detailFilters,
  onDetailFiltersChange,
}: ArenaAverageFilterProps) => {
  const toggleDifficulty = (diff: string) => {
    const next = new Set(selectedDifficulties);
    if (next.has(diff)) {
      if (next.size > 1) next.delete(diff);
    } else {
      next.add(diff);
    }
    onDifficultiesChange(next);
  };

  const addFilter = () => {
    onDetailFiltersChange([
      ...detailFilters,
      {
        id: crypto.randomUUID(),
        rank: "A1",
        metric: "scoreRate",
        operator: ">=",
        value: "",
      },
    ]);
  };

  const removeFilter = (id: string) => {
    onDetailFiltersChange(detailFilters.filter((f) => f.id !== id));
  };

  const updateFilter = (id: string, updates: Partial<DetailFilter>) => {
    onDetailFiltersChange(
      detailFilters.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    );
  };

  return (
    <div className="rounded-xl border border-bpim-border bg-bpim-bg/80 p-4 shadow-sm backdrop-blur-md">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black tracking-widest text-bpim-muted uppercase px-1">
              Version
            </span>
            <Select value={version} onValueChange={onVersionChange}>
              <SelectTrigger className="h-9 border-bpim-border bg-bpim-surface-2/60 text-xs text-bpim-text focus:ring-blue-500">
                <SelectValue placeholder="バージョンを選択" />
              </SelectTrigger>
              <SelectContent className="border-bpim-border bg-bpim-bg">
                {versionsNonDisabledCollection.map((v) => (
                  <SelectItem key={v.value} value={v.value} className="text-xs">
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black tracking-widest text-bpim-muted uppercase px-1">
              Level
            </span>
            <RadioGroup
              value={level}
              onValueChange={onLevelChange}
              className="flex h-9 items-center gap-8"
            >
              {["11", "12"].map((lv) => (
                <div key={lv} className="flex items-center gap-2">
                  <RadioGroupItem
                    value={lv}
                    id={`lv-${lv}`}
                    className="border-bpim-primary text-bpim-text"
                  />
                  <Label
                    htmlFor={`lv-${lv}`}
                    className="text-sm font-bold text-bpim-text cursor-pointer"
                  >
                    ☆{lv}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black tracking-widest text-bpim-muted uppercase px-1">
              Difficulty
            </span>
            <div className="flex h-9 items-center gap-x-4 gap-y-2 flex-wrap">
              {(["HYPER", "ANOTHER", "LEGGENDARIA"] as const).map((str) => (
                <div key={str} className="flex items-center gap-2">
                  <Checkbox
                    id={`diff-${str}`}
                    checked={selectedDifficulties.has(str)}
                    onCheckedChange={() => toggleDifficulty(str)}
                    className="h-4 w-4 border-bpim-border data-[state=checked]:bg-bpim-primary"
                  />
                  <Label
                    htmlFor={`diff-${str}`}
                    className="cursor-pointer text-xs font-medium leading-none md:text-sm text-bpim-text"
                  >
                    {str[0]}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black tracking-widest text-bpim-muted uppercase px-1">
              楽曲名
            </span>
            <Input
              value={nameSearch}
              onChange={(e) => onNameSearchChange(e.target.value)}
              placeholder="検索..."
              className="h-9 border-bpim-border bg-bpim-surface-2/60 text-xs text-bpim-text placeholder:text-bpim-muted"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 px-1">
            <span className="text-[10px] font-black tracking-widest text-bpim-muted uppercase">
              フィルタ
            </span>
            <button
              onClick={addFilter}
              className="flex items-center gap-1 text-[10px] font-bold text-bpim-primary hover:text-bpim-primary/70 transition-colors"
            >
              <Plus className="h-3 w-3" />
              追加
            </button>
          </div>

          {detailFilters.length > 0 && (
            <div className="flex flex-col gap-2">
              {detailFilters.map((filter) => (
                <DetailFilterRow
                  key={filter.id}
                  filter={filter}
                  onChange={(updates) => updateFilter(filter.id, updates)}
                  onRemove={() => removeFilter(filter.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DetailFilterRow = ({
  filter,
  onChange,
  onRemove,
}: {
  filter: DetailFilter;
  onChange: (updates: Partial<DetailFilter>) => void;
  onRemove: () => void;
}) => (
  <div className="flex flex-wrap items-center gap-2">
    <Select value={filter.rank} onValueChange={(v) => onChange({ rank: v })}>
      <SelectTrigger className="h-8 w-18 border-bpim-border bg-bpim-surface-2/60 text-xs text-bpim-text">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="border-bpim-border bg-bpim-bg">
        {RANKS.map((r) => (
          <SelectItem key={r} value={r} className="text-xs">
            {r}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>

    <span className="text-xs text-bpim-muted">の</span>

    <Select
      value={filter.metric}
      onValueChange={(v) =>
        onChange({ metric: v as DetailFilterMetric, value: "" })
      }
    >
      <SelectTrigger className="h-8 w-28 border-bpim-border bg-bpim-surface-2/60 text-xs text-bpim-text">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="border-bpim-border bg-bpim-bg">
        {METRICS.map((m) => (
          <SelectItem key={m.value} value={m.value} className="text-xs">
            {m.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>

    <span className="text-xs text-bpim-muted">が</span>

    {filter.metric === "djrank" ? (
      <Select
        value={filter.value}
        onValueChange={(v) => onChange({ value: v })}
      >
        <SelectTrigger className="h-8 w-20 border-bpim-border bg-bpim-surface-2/60 text-xs text-bpim-text">
          <SelectValue placeholder="ランク" />
        </SelectTrigger>
        <SelectContent className="border-bpim-border bg-bpim-bg">
          {DJRANK_OPTIONS.map((r) => (
            <SelectItem key={r} value={r} className="text-xs">
              {r}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    ) : (
      <Input
        value={filter.value}
        onChange={(e) => onChange({ value: e.target.value })}
        placeholder={filter.metric === "score" ? "スコア" : "0-100"}
        className="h-8 w-24 border-bpim-border bg-bpim-surface-2/60 text-xs text-bpim-text placeholder:text-bpim-muted"
        type="number"
        min={0}
      />
    )}

    <Select
      value={filter.operator}
      onValueChange={(v) => onChange({ operator: v as DetailFilterOperator })}
    >
      <SelectTrigger className="h-8 w-16 border-bpim-border bg-bpim-surface-2/60 text-xs text-bpim-text">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="border-bpim-border bg-bpim-bg">
        <SelectItem value=">=" className="text-xs">
          以上
        </SelectItem>
        <SelectItem value="<=" className="text-xs">
          以下
        </SelectItem>
      </SelectContent>
    </Select>

    <button
      onClick={onRemove}
      className="text-bpim-muted hover:text-red-400 transition-colors"
    >
      <X className="h-4 w-4" />
    </button>
  </div>
);
