"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select";

const GROUPS = [
  { id: "near", label: "実力が近いユーザーを探す" },
  { id: "rank", label: "ランキング" },
  { id: "active", label: "特殊検索" },
] as const;

const SORT_ITEMS = [
  { label: "総合BPIが近い", value: "totalBpi_distance", group: "near" },
  { label: "NOTESが近い", value: "notes_distance", group: "near" },
  { label: "SCRATCHが近い", value: "scratch_distance", group: "near" },
  { label: "CHORDが近い", value: "chord_distance", group: "near" },
  { label: "PEAKが近い", value: "peak_distance", group: "near" },
  { label: "CHARGEが近い", value: "charge_distance", group: "near" },
  { label: "SOFLANが近い", value: "soflan_distance", group: "near" },
  { label: "総合BPIが高い順", value: "totalBpi_desc", group: "rank" },
  { label: "NOTESが高い順", value: "notes_desc", group: "rank" },
  { label: "SCRATCHが高い順", value: "scratch_desc", group: "rank" },
  { label: "CHORDが高い順", value: "chord_desc", group: "rank" },
  { label: "PEAKが高い順", value: "peak_desc", group: "rank" },
  { label: "CHARGEが高い順", value: "charge_desc", group: "rank" },
  { label: "SOFLANが高い順", value: "soflan_desc", group: "rank" },
  {
    label: "最近スコアを更新した人",
    value: "totalBpi_newest",
    group: "active",
  },
];

export const SortSelector = ({
  sort,
  order,
  onChange,
}: {
  sort: string;
  order: string;
  onChange: (val: string) => void;
}) => {
  return (
    <Select value={`${sort}_${order}`} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-full border-none bg-bpim-bg/50 text-bpim-text focus:ring-blue-500">
        <SelectValue placeholder="並び替えを選択" />
      </SelectTrigger>
      <SelectContent className="border-bpim-border bg-bpim-bg text-bpim-text">
        {GROUPS.map((group, index) => {
          const items = SORT_ITEMS.filter((i) => i.group === group.id);
          if (items.length === 0) return null;

          return (
            <React.Fragment key={group.id}>
              {index > 0 && <SelectSeparator className="bg-bpim-surface-2/60" />}
              <SelectGroup>
                <SelectLabel className="px-2 py-1.5 text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
                  {group.label}
                </SelectLabel>
                {items.map((item) => (
                  <SelectItem
                    key={item.value}
                    value={item.value}
                    className="text-xs"
                  >
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </React.Fragment>
          );
        })}
      </SelectContent>
    </Select>
  );
};
