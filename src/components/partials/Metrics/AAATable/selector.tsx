"use client";

import { GroupingMode } from "@/hooks/metrics/useAAATable";
import { versionsNonDisabledCollection } from "@/constants/versions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Props {
  version: string;
  onVersionChange: (v: string) => void;
  level: number;
  onLevelChange: (l: number) => void;
  goal: "aaa" | "maxMinus";
  onGoalChange: (g: "aaa" | "maxMinus") => void;
  groupingMode: GroupingMode;
  onGroupingModeChange: (m: GroupingMode) => void;
}

export const AAATableFilter = ({
  version,
  onVersionChange,
  level,
  onLevelChange,
  goal,
  onGoalChange,
  groupingMode,
  onGroupingModeChange,
}: Props) => {
  const sections = [
    {
      label: "バージョン",
      className: "min-w-full md:min-w-[160px]",
      render: () => (
        <Select value={version} onValueChange={onVersionChange}>
          <SelectTrigger className="h-8 border-white/10 bg-black/20 text-xs text-slate-200 focus:ring-blue-500">
            <SelectValue placeholder="Version" />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-slate-900">
            {versionsNonDisabledCollection.map((v) => (
              <SelectItem key={v.value} value={v.value} className="text-xs">
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      label: "レベル",
      render: () => (
        <RadioGroup
          value={level.toString()}
          onValueChange={(v) => onLevelChange(Number(v))}
          className="flex h-8 items-center gap-4"
        >
          {[11, 12].map((lv) => (
            <div key={lv} className="flex items-center gap-1.5">
              <RadioGroupItem
                value={lv.toString()}
                id={`level-${lv}`}
                className="border-blue-500 text-blue-500"
              />
              <Label
                htmlFor={`level-${lv}`}
                className="text-xs font-bold text-slate-200 cursor-pointer"
              >
                ☆{lv}
              </Label>
            </div>
          ))}
        </RadioGroup>
      ),
    },
    {
      label: "目標",
      render: () => (
        <RadioGroup
          value={goal}
          onValueChange={(v) => onGoalChange(v as any)}
          className="flex h-8 items-center gap-4"
        >
          {[
            { id: "aaa", label: "AAA" },
            { id: "maxMinus", label: "MAX-" },
          ].map((g) => (
            <div key={g.id} className="flex items-center gap-1.5">
              <RadioGroupItem
                value={g.id}
                id={`goal-${g.id}`}
                className="border-blue-500 text-blue-500"
              />
              <Label
                htmlFor={`goal-${g.id}`}
                className="text-xs font-bold text-slate-200 cursor-pointer"
              >
                {g.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      ),
    },
    {
      label: "並び替え基準",
      render: () => (
        <RadioGroup
          value={groupingMode}
          onValueChange={(v) => onGroupingModeChange(v as any)}
          className="flex h-8 items-center gap-4"
        >
          {[
            { id: "target", label: "目標" },
            { id: "self", label: "マイスコア" },
          ].map((m) => (
            <div key={m.id} className="flex items-center gap-1.5">
              <RadioGroupItem
                value={m.id}
                id={`mode-${m.id}`}
                className="border-blue-500 text-blue-500"
              />
              <Label
                htmlFor={`mode-${m.id}`}
                className="text-xs font-bold text-slate-200 cursor-pointer"
              >
                {m.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      ),
    },
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4 shadow-sm backdrop-blur-md">
      <div className="flex flex-col flex-wrap gap-4 md:flex-row md:items-start md:gap-x-10 md:gap-y-6">
        {sections.map((section) => (
          <div
            key={section.label}
            className={cn("flex flex-col gap-2", section.className)}
          >
            <span className="px-1 text-[10px] font-black tracking-widest text-slate-500 uppercase">
              {section.label}
            </span>
            <div className="flex items-center">{section.render()}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
