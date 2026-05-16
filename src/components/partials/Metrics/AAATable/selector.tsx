"use client";

import { useState, useEffect } from "react";
import { GroupingMode } from "@/types/metrics/aaa";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Loader, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomGoalModal } from "./CustomGoalModal";
import { CustomGoalConfig, GoalType, CardDisplay } from "@/types/metrics/aaa";

interface Props {
  version: string;
  onVersionChange: (v: string) => void;
  level: number;
  onLevelChange: (l: number) => void;
  goal: GoalType;
  onGoalChange: (g: GoalType) => void;
  groupingMode: GroupingMode;
  onGroupingModeChange: (m: GroupingMode) => void;
  showAbove: boolean;
  onShowAboveChange: (v: boolean) => void;
  showBelow: boolean;
  onShowBelowChange: (v: boolean) => void;
  maxDiffFilter: number | undefined;
  onMaxDiffFilterChange: (v: number | undefined) => void;
  customGoal: CustomGoalConfig | null;
  onCustomGoalChange: (config: CustomGoalConfig) => void;
  cardDisplay: CardDisplay;
  onCardDisplayChange: (v: CardDisplay) => void;
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
  showAbove,
  onShowAboveChange,
  showBelow,
  onShowBelowChange,
  maxDiffFilter,
  onMaxDiffFilterChange,
  customGoal,
  onCustomGoalChange,
  cardDisplay,
  onCardDisplayChange,
}: Props) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [draftDiff, setDraftDiff] = useState<string>(
    maxDiffFilter !== undefined ? String(maxDiffFilter) : "",
  );
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    setIsPending(true);
    const timer = setTimeout(() => {
      const v = draftDiff.trim();
      onMaxDiffFilterChange(v === "" ? undefined : Math.max(0, Number(v)));
      setIsPending(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [draftDiff]); // eslint-disable-line react-hooks/exhaustive-deps
  const sections = [
    {
      label: "バージョン",
      className: "min-w-[160px]",
      render: () => (
        <Select value={version} onValueChange={onVersionChange}>
          <SelectTrigger className="h-8 border-bpim-border bg-bpim-bg/20 text-xs text-bpim-text focus:ring-blue-500">
            <SelectValue placeholder="Version" />
          </SelectTrigger>
          <SelectContent className="border-bpim-border bg-bpim-bg">
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
                className="border-bpim-primary text-bpim-text"
              />
              <Label
                htmlFor={`level-${lv}`}
                className="text-xs font-bold text-bpim-text cursor-pointer"
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
      render: () => {
        const customLabel = (() => {
          if (!customGoal) return null;
          if (customGoal.type === "percentage")
            return `${Math.round(customGoal.ratio * 1000) / 10}%`;
          const offsetStr =
            customGoal.offset !== 0
              ? `${customGoal.offset > 0 ? "+" : ""}${customGoal.offset}`
              : "";
          return `${customGoal.label}${offsetStr}`;
        })();

        return (
          <>
            <RadioGroup
              value={goal}
              onValueChange={(v) => {
                if (v === "custom" && !customGoal) {
                  setModalOpen(true);
                }
                onGoalChange(v as GoalType);
              }}
              className="flex h-8 items-center gap-4"
            >
              {[
                { id: "aaa", label: "AAA" },
                { id: "maxMinus", label: "MAX-" },
                { id: "custom", label: "カスタム" },
              ].map((g) => (
                <div key={g.id} className="flex items-center gap-1.5">
                  <RadioGroupItem
                    value={g.id}
                    id={`goal-${g.id}`}
                    className="border-bpim-primary text-bpim-text"
                  />
                  <Label
                    htmlFor={`goal-${g.id}`}
                    className="text-xs font-bold text-bpim-text cursor-pointer"
                  >
                    {g.label}
                    {g.id === "custom" && customLabel && (
                      <span className="ml-1 font-mono text-bpim-muted">
                        ({customLabel})
                      </span>
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {goal === "custom" && (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="ml-2 flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold text-bpim-muted border border-bpim-border hover:border-bpim-primary hover:text-bpim-text transition-colors whitespace-nowrap"
              >
                <Pencil className="h-2.5 w-2.5" />
                編集
              </button>
            )}
            <CustomGoalModal
              open={modalOpen}
              onOpenChange={setModalOpen}
              initial={customGoal}
              onSave={onCustomGoalChange}
            />
          </>
        );
      },
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
                className="border-bpim-primary text-bpim-text"
              />
              <Label
                htmlFor={`mode-${m.id}`}
                className="text-xs font-bold text-bpim-text cursor-pointer"
              >
                {m.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      ),
    },
    {
      label: "達成状況",
      render: () => (
        <div className="flex h-8 items-center gap-4">
          {[
            {
              id: "above",
              label: "+",
              checked: showAbove,
              onChange: onShowAboveChange,
            },
            {
              id: "below",
              label: "-",
              checked: showBelow,
              onChange: onShowBelowChange,
            },
          ].map((item) => (
            <div key={item.id} className="flex items-center gap-1.5">
              <Checkbox
                id={`filter-${item.id}`}
                checked={item.checked}
                onCheckedChange={(v) => item.onChange(v === true)}
                className="border-bpim-primary data-[state=checked]:bg-bpim-primary data-[state=checked]:border-bpim-primary"
              />
              <Label
                htmlFor={`filter-${item.id}`}
                className="text-xs font-bold text-bpim-text cursor-pointer font-mono"
              >
                {item.label}
              </Label>
            </div>
          ))}
        </div>
      ),
    },
    {
      label: "目標まであと",
      render: () => (
        <div className="flex h-8 items-center gap-1.5">
          <div className="relative">
            <Input
              type="number"
              min={0}
              placeholder=""
              value={draftDiff}
              onChange={(e) => setDraftDiff(e.target.value)}
              className="h-8 w-24 border-bpim-border bg-bpim-bg/20 pr-6 text-xs text-bpim-text placeholder:text-bpim-muted focus-visible:ring-blue-500"
            />
            {isPending && (
              <Loader className="absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin text-bpim-muted" />
            )}
          </div>
          <span className="text-xs font-bold text-bpim-muted">点以内</span>
        </div>
      ),
    },
    {
      label: "カード表示",
      render: () => (
        <RadioGroup
          value={cardDisplay}
          onValueChange={(v) => onCardDisplayChange(v as CardDisplay)}
          className="flex h-8 items-center gap-4"
        >
          {[
            { id: "bpi", label: "BPI" },
            { id: "exScore", label: "EXスコア" },
          ].map((m) => (
            <div key={m.id} className="flex items-center gap-1.5">
              <RadioGroupItem
                value={m.id}
                id={`card-${m.id}`}
                className="border-bpim-primary text-bpim-text"
              />
              <Label
                htmlFor={`card-${m.id}`}
                className="text-xs font-bold text-bpim-text cursor-pointer"
              >
                {m.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      ),
    },
  ];

  const renderSection = (label: string) => {
    const section = sections.find((s) => s.label === label)!;
    return (
      <div key={label} className={cn("flex flex-col gap-2", section.className)}>
        <span className="px-1 text-[10px] font-black tracking-widest text-bpim-muted uppercase">
          {label}
        </span>
        <div className="flex items-center">{section.render()}</div>
      </div>
    );
  };

  const row = "flex flex-wrap items-start gap-x-8 gap-y-3";

  return (
    <div className="rounded-xl border border-bpim-border bg-bpim-bg/40 p-4 shadow-sm backdrop-blur-md">
      <div className="flex flex-col gap-4 md:hidden">
        <div className={row}>
          {renderSection("バージョン")}
          {renderSection("レベル")}
        </div>
        <div>{renderSection("目標")}</div>
        <div className={row}>
          {renderSection("並び替え基準")}
          {renderSection("達成状況")}
        </div>
        <div className={row}>
          {renderSection("目標まであと")}
          {renderSection("カード表示")}
        </div>
      </div>
      <div className="hidden md:flex md:flex-wrap md:items-start md:gap-x-10 md:gap-y-6">
        {sections.map((section) => (
          <div
            key={section.label}
            className={cn("flex flex-col gap-2", section.className)}
          >
            <span className="px-1 text-[10px] font-black tracking-widest text-bpim-muted uppercase">
              {section.label}
            </span>
            <div className="flex items-center">{section.render()}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
