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
import { useTranslation } from "@/hooks/common/useTranslation";

export const SortSelector = ({
  sort,
  order,
  onChange,
}: {
  sort: string;
  order: string;
  onChange: (val: string) => void;
}) => {
  const { t } = useTranslation();

  const GROUPS = [
    { id: "near", label: t("rivals.sort.groupNear") },
    { id: "rank", label: t("rivals.sort.groupRank") },
    { id: "active", label: t("rivals.sort.groupActive") },
  ] as const;

  const SORT_ITEMS = [
    { label: t("rivals.sort.totalBpiNear"), value: "totalBpi_distance", group: "near" },
    { label: t("rivals.sort.notesNear"), value: "notes_distance", group: "near" },
    { label: t("rivals.sort.scratchNear"), value: "scratch_distance", group: "near" },
    { label: t("rivals.sort.chordNear"), value: "chord_distance", group: "near" },
    { label: t("rivals.sort.peakNear"), value: "peak_distance", group: "near" },
    { label: t("rivals.sort.chargeNear"), value: "charge_distance", group: "near" },
    { label: t("rivals.sort.soflanNear"), value: "soflan_distance", group: "near" },
    { label: t("rivals.sort.totalBpiDesc"), value: "totalBpi_desc", group: "rank" },
    { label: t("rivals.sort.notesDesc"), value: "notes_desc", group: "rank" },
    { label: t("rivals.sort.scratchDesc"), value: "scratch_desc", group: "rank" },
    { label: t("rivals.sort.chordDesc"), value: "chord_desc", group: "rank" },
    { label: t("rivals.sort.peakDesc"), value: "peak_desc", group: "rank" },
    { label: t("rivals.sort.chargeDesc"), value: "charge_desc", group: "rank" },
    { label: t("rivals.sort.soflanDesc"), value: "soflan_desc", group: "rank" },
    { label: t("rivals.sort.recentlyUpdated"), value: "totalBpi_newest", group: "active" },
  ];

  return (
    <Select value={`${sort}_${order}`} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-full border-none bg-bpim-bg/50 text-bpim-text focus:ring-blue-500">
        <SelectValue placeholder={t("rivals.sort.placeholder")} />
      </SelectTrigger>
      <SelectContent className="border-bpim-border bg-bpim-bg text-bpim-text">
        {GROUPS.map((group, index) => {
          const items = SORT_ITEMS.filter((i) => i.group === group.id);
          if (items.length === 0) return null;

          return (
            <React.Fragment key={group.id}>
              {index > 0 && (
                <SelectSeparator className="bg-bpim-surface-2/60" />
              )}
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
