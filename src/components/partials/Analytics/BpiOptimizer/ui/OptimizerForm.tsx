import { CircleDashed, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OptimizerStrategy } from "@/types/bpi-optimizer";
import type { RadarCategory } from "@/types/stats/radar";
import { BpiChip } from "./BpiChip";
import { OptimizerGuide } from "./OptimizerGuide";
import { RADAR_LABELS } from "./shared";

const ALL_RADAR_ELEMENTS: RadarCategory[] = [
  "NOTES",
  "CHORD",
  "PEAK",
  "CHARGE",
  "SCRATCH",
  "SOFLAN",
];

interface OptimizerFormProps {
  targetBpiInput: string;
  onTargetBpiChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSubmit: () => void;
  inputError: boolean;
  isLoading: boolean;
  strategies: OptimizerStrategy[];
  onToggleStrategy: (s: OptimizerStrategy) => void;
  levels: string[];
  onToggleLevel: (l: string) => void;
  difficulties: string[];
  onToggleDifficulty: (d: string) => void;
  radarElements: RadarCategory[];
  onToggleRadarElement: (cat: RadarCategory) => void;
  strongRadarCategories: RadarCategory[];
  weakRadarCategories: RadarCategory[];
  currentTotalBpi: number | null;
  maxStepsInput: string;
  onMaxStepsChange: (v: string) => void;
  searchMode: "fastest" | "flexible";
  onSearchModeChange: (mode: "fastest" | "flexible") => void;
  considerCurrentTotalBpi: boolean;
  onConsiderCurrentTotalBpiChange: (v: boolean) => void;
}

export const OptimizerForm = ({
  targetBpiInput,
  onTargetBpiChange,
  maxStepsInput,
  onMaxStepsChange,
  onKeyDown,
  onSubmit,
  inputError,
  isLoading,
  strategies,
  onToggleStrategy,
  currentTotalBpi,
  searchMode,
  onSearchModeChange,
  considerCurrentTotalBpi,
  onConsiderCurrentTotalBpiChange,
  radarElements,
  onToggleRadarElement,
  strongRadarCategories,
  weakRadarCategories,
}: OptimizerFormProps) => (
  <div className="rounded-2xl border border-bpim-border bg-bpim-surface p-5 flex flex-col gap-6 shadow-lg">
    <div className="flex items-center justify-between border-b border-bpim-border pb-2">
      <h2 className="text-sm font-bold flex items-center gap-2">条件設定</h2>
      {currentTotalBpi !== null && (
        <div className="flex items-center gap-2 text-[11px] font-bold text-bpim-muted bg-bpim-bg px-2 py-2 rounded-full">
          現在の総合BPI: <BpiChip bpi={currentTotalBpi} size="xs" />
        </div>
      )}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label className="text-xs font-black text-bpim-muted uppercase tracking-tighter">
          目標の総合BPI
        </Label>
        <Input
          type="number"
          value={targetBpiInput}
          onChange={(e) => onTargetBpiChange(e.target.value)}
          onKeyDown={onKeyDown}
          className={cn(
            "h-12 text-lg font-mono pl-4 bg-bpim-bg border-2 transition-all",
            inputError
              ? "border-bpim-danger"
              : "border-bpim-border focus:border-bpim-primary",
          )}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-black text-bpim-muted uppercase tracking-tighter">
          改善に取り組む曲数（目安）
        </Label>
        <Input
          type="number"
          value={maxStepsInput}
          onChange={(e) => onMaxStepsChange(e.target.value)}
          onKeyDown={onKeyDown}
          className="h-12 text-lg font-mono bg-bpim-bg border-2 border-bpim-border focus:border-bpim-primary"
        />
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-3">
        <Label className="text-[10px] font-black text-bpim-muted uppercase tracking-widest">
          アルゴリズムの性格
        </Label>
        <div className="flex p-1 bg-bpim-bg rounded-xl border border-bpim-border">
          {[
            { id: "fastest", label: "スパルタ", desc: "最短経路を探索" },
            {
              id: "flexible",
              label: "フレキシブル",
              desc: "ゆるく達成できるルートを探索",
            },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() =>
                onSearchModeChange(mode.id as "fastest" | "flexible")
              }
              className={cn(
                "flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex flex-col items-center",
                searchMode === mode.id
                  ? "bg-bpim-surface text-bpim-primary shadow-sm ring-1 ring-bpim-border"
                  : "text-bpim-subtle hover:text-bpim-text",
              )}
            >
              <span>{mode.label}</span>
              <span className="text-[9px] opacity-60 font-normal">
                {mode.desc}
              </span>
            </button>
          ))}
        </div>
        <label
          className={cn(
            "flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors",
            considerCurrentTotalBpi
              ? "border-bpim-primary/40 bg-bpim-primary/5"
              : "border-bpim-border bg-bpim-bg hover:bg-bpim-overlay",
          )}
        >
          <Checkbox
            checked={considerCurrentTotalBpi}
            onCheckedChange={(checked) =>
              onConsiderCurrentTotalBpiChange(checked === true)
            }
            className="sr-only"
          />
          <TrendingUp
            className={cn(
              "h-3.5 w-3.5",
              considerCurrentTotalBpi
                ? "text-bpim-primary"
                : "text-bpim-subtle",
            )}
          />
          <span className="text-xs font-bold">
            現在の総合BPIを考慮して算出する
          </span>
        </label>
      </div>

      <div className="space-y-3">
        <Label className="text-[10px] font-black text-bpim-muted uppercase tracking-widest">
          重視するプレイスタイル
        </Label>
        <div className="grid grid-cols-1 gap-2">
          {[
            {
              key: "unplayed",
              label: "未プレイ曲を埋める",
              icon: CircleDashed,
            },
            { key: "played", label: "既プレイ曲を伸ばす", icon: TrendingUp },
          ].map((item) => (
            <label
              key={item.key}
              className={cn(
                "flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors",
                strategies.includes(item.key as OptimizerStrategy)
                  ? "border-bpim-primary/40 bg-bpim-primary/5"
                  : "border-bpim-border bg-bpim-bg hover:bg-bpim-overlay",
              )}
            >
              <Checkbox
                checked={strategies.includes(item.key as OptimizerStrategy)}
                onCheckedChange={() =>
                  onToggleStrategy(item.key as OptimizerStrategy)
                }
                className="sr-only"
              />
              <item.icon
                className={cn(
                  "h-3.5 w-3.5",
                  strategies.includes(item.key as OptimizerStrategy)
                    ? "text-bpim-primary"
                    : "text-bpim-subtle",
                )}
              />
              <span className="text-xs font-bold">{item.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>

    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label className="text-[10px] font-black text-bpim-muted uppercase tracking-widest">
          特定要素を持つ楽曲を指定
        </Label>
        <span className="text-[9px] text-bpim-subtle">
          （全選択で全楽曲を対象にします）
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {ALL_RADAR_ELEMENTS.map((cat) => {
          const isChecked = radarElements.includes(cat);
          const isStrong = strongRadarCategories.includes(cat);
          const isWeak = weakRadarCategories.includes(cat);
          return (
            <label
              key={cat}
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors",
                isChecked
                  ? "border-bpim-primary/40 bg-bpim-primary/5"
                  : "border-bpim-border bg-bpim-bg hover:bg-bpim-overlay",
              )}
            >
              <Checkbox
                checked={isChecked}
                onCheckedChange={() => onToggleRadarElement(cat)}
                className="sr-only"
              />
              <span
                className={cn(
                  "text-xs font-bold",
                  isChecked ? "text-bpim-text" : "text-bpim-subtle",
                )}
              >
                {RADAR_LABELS[cat]}
              </span>
              {isStrong && (
                <Badge className="text-[9px] h-4 px-1.5 ml-auto bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
                  得意
                </Badge>
              )}
              {isWeak && !isStrong && (
                <Badge className="text-[9px] h-4 px-1.5 ml-auto bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold">
                  苦手
                </Badge>
              )}
            </label>
          );
        })}
      </div>
    </div>

    <OptimizerGuide />

    <Button
      onClick={onSubmit}
      disabled={isLoading || inputError || !targetBpiInput || !maxStepsInput}
      className="w-full h-12 bg-bpim-primary text-white hover:bg-bpim-primary/90 font-black text-sm"
    >
      {isLoading ? <CircleDashed className="animate-spin" /> : "計算開始"}
    </Button>
  </div>
);
