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
import { versionsNonDisabledCollection } from "@/constants/versions";

interface ArenaAverageFilterProps {
  version: string;
  onVersionChange: (value: string) => void;
  level: string;
  onLevelChange: (value: string) => void;
}

export const ArenaAverageFilter = ({
  version,
  onVersionChange,
  level,
  onLevelChange,
}: ArenaAverageFilterProps) => {
  return (
    <div className="rounded-xl border border-bpim-border bg-bpim-bg/80 p-4 shadow-sm backdrop-blur-md">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-10">
        <div className="flex flex-col gap-2 min-w-full md:min-w-[240px]">
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
      </div>
    </div>
  );
};
