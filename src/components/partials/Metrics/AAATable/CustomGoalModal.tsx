"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RANK_TABLE } from "@/constants/iidx/djRank";
import { CustomGoalConfig } from "@/types/metrics/aaa";
import { cn } from "@/lib/utils";

const MODAL_RANKS = [
  { label: "MAX", ratio: 1 },
  ...RANK_TABLE.filter((r) =>
    ["MAX-", "AAA", "AA", "A", "B"].includes(r.label),
  ).sort((a, b) => b.ratio - a.ratio),
];

type Selection = (typeof MODAL_RANKS)[number]["label"] | "percentage";

const toSelection = (config: CustomGoalConfig | null): Selection => {
  if (!config) return "AAA";
  if (config.type === "percentage") return "percentage";
  return (MODAL_RANKS.find((r) => r.label === config.label)?.label ??
    "AAA") as Selection;
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: CustomGoalConfig | null;
  onSave: (config: CustomGoalConfig) => void;
}

export const CustomGoalModal = ({
  open,
  onOpenChange,
  initial,
  onSave,
}: Props) => {
  const [selection, setSelection] = useState<Selection>(toSelection(initial));
  const [offsetDir, setOffsetDir] = useState<"+" | "-">(() =>
    initial?.type === "djRank" && initial.offset < 0 ? "-" : "+",
  );
  const [offsetInput, setOffsetInput] = useState<string>(() =>
    initial?.type === "djRank" && initial.offset !== 0
      ? String(Math.abs(initial.offset))
      : "",
  );
  const [percentageInput, setPercentageInput] = useState<string>(() =>
    initial?.type === "percentage"
      ? String(Math.round(initial.ratio * 1000) / 10)
      : "",
  );

  const percentageValid = (() => {
    const v = parseFloat(percentageInput);
    return !isNaN(v) && v > 0 && v <= 100;
  })();

  const canSave = selection !== "percentage" || percentageValid;

  const handleSave = () => {
    if (!canSave) return;
    if (selection === "percentage") {
      onSave({ type: "percentage", ratio: parseFloat(percentageInput) / 100 });
    } else {
      const preset = MODAL_RANKS.find((p) => p.label === selection)!;
      const absOffset = parseInt(offsetInput) || 0;
      const signedOffset = offsetDir === "+" ? absOffset : -absOffset;
      onSave({
        type: "djRank",
        label: preset.label,
        ratio: preset.ratio,
        offset: signedOffset,
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm border-bpim-border bg-bpim-bg text-bpim-text">
        <DialogHeader>
          <DialogTitle className="text-bpim-text">
            カスタム目標を設定
          </DialogTitle>
          <DialogDescription className="text-[11px] text-bpim-muted">
            設定はこの端末にのみ保存されます
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5 pt-1">
          {MODAL_RANKS.map((rank) => {
            const isSelected = selection === rank.label;
            return (
              <label
                key={rank.label}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                  isSelected
                    ? "border-bpim-primary bg-bpim-primary/10"
                    : "border-bpim-border bg-bpim-surface hover:border-bpim-primary/40",
                )}
              >
                <input
                  type="radio"
                  name="custom-goal"
                  value={rank.label}
                  checked={isSelected}
                  onChange={() => setSelection(rank.label as Selection)}
                  className="accent-bpim-primary"
                />
                <span className="w-12 text-sm font-black text-bpim-text">
                  {rank.label}
                </span>
                <span className="w-12 font-mono text-[10px] text-bpim-muted">
                  {Math.round(rank.ratio * 1000) / 10}%
                </span>
                <div
                  className={cn(
                    "ml-auto flex items-center gap-1.5 transition-opacity",
                    !isSelected && "pointer-events-none opacity-30",
                  )}
                >
                  <Select
                    value={offsetDir}
                    onValueChange={(v) => setOffsetDir(v as "+" | "-")}
                  >
                    <SelectTrigger className="h-7 w-14 border-bpim-border bg-bpim-bg/30 text-xs text-bpim-text focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-bpim-border bg-bpim-bg">
                      <SelectItem value="+" className="text-xs font-mono">
                        +
                      </SelectItem>
                      <SelectItem value="-" className="text-xs font-mono">
                        -
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={offsetInput}
                    placeholder="0"
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      setSelection(rank.label as Selection);
                      setOffsetInput(e.target.value);
                    }}
                    className="h-7 w-20 border-bpim-border bg-bpim-bg/20 text-xs text-bpim-text placeholder:text-bpim-muted focus-visible:ring-blue-500"
                  />
                  <span className="text-[10px] text-bpim-muted">pt</span>
                </div>
              </label>
            );
          })}

          <label
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors",
              selection === "percentage"
                ? "border-bpim-primary bg-bpim-primary/10"
                : "border-bpim-border bg-bpim-surface hover:border-bpim-primary/40",
            )}
          >
            <input
              type="radio"
              name="custom-goal"
              value="percentage"
              checked={selection === "percentage"}
              onChange={() => setSelection("percentage")}
              className="accent-bpim-primary"
            />
            <span className="flex-1 text-sm font-black text-bpim-text">
              スコアレート
            </span>
            <div
              className={cn(
                "flex items-center gap-1.5 transition-opacity",
                selection !== "percentage" && "pointer-events-none opacity-30",
              )}
            >
              <Input
                type="number"
                min={0.1}
                max={100}
                step={0.1}
                value={percentageInput}
                placeholder="88.9"
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  setSelection("percentage");
                  setPercentageInput(e.target.value);
                }}
                className={cn(
                  "h-7 w-20 border-bpim-border bg-bpim-bg/20 text-xs text-bpim-text placeholder:text-bpim-muted focus-visible:ring-blue-500",
                  selection === "percentage" &&
                    !percentageValid &&
                    percentageInput !== "" &&
                    "border-bpim-danger",
                )}
              />
              <Label className="text-[10px] text-bpim-muted">%</Label>
            </div>
          </label>
        </div>

        <Button
          onClick={handleSave}
          disabled={!canSave}
          className="mt-1 w-full bg-bpim-primary font-bold text-bpim-bg hover:bg-bpim-primary/80 disabled:opacity-40"
        >
          保存
        </Button>
      </DialogContent>
    </Dialog>
  );
};
