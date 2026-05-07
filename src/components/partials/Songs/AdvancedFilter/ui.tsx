"use client";

import { useState, useEffect } from "react";
import {
  FilterParamsFrontend,
  ScoreFilterCondition,
} from "@/types/songs/score";
import { verNameArr } from "@/constants/versions";
import { CLEAR_STATES } from "@/constants/lampState";
import dayjs from "@/lib/dayjs";
import { cn } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X } from "lucide-react";

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

interface Props {
  isOpen: boolean;
  onClose: () => void;
  params: FilterParamsFrontend;
  onParamsChange: (params: Partial<FilterParamsFrontend>) => void;
}

export const AdvancedFilterModal = ({
  isOpen,
  onClose,
  params,
  onParamsChange,
}: Props) => {
  const [localParams, setLocalParams] = useState<FilterParamsFrontend>(params);

  useEffect(() => {
    if (isOpen) {
      setLocalParams(params);
    }
  }, [isOpen, params]);

  const periodOptions = [
    { label: "今日", value: "today" },
    { label: "昨日", value: "yesterday" },
    { label: "今週", value: "thisWeek" },
    { label: "今月", value: "thisMonth" },
    { label: "直近7日", value: "past7" },
    { label: "直近30日", value: "past30" },
  ];

  const isCustomActive =
    localParams.since &&
    !periodOptions.find((v) => v.value === localParams.since);

  const updateLocal = (val: Partial<FilterParamsFrontend>) => {
    setLocalParams((prev) => ({ ...prev, ...val }));
  };

  const handleApply = () => {
    onParamsChange(localParams);
    onClose();
  };

  const handleReset = () => {
    setLocalParams({
      bpmMin: undefined,
      bpmMax: undefined,
      isSofran: undefined,
      since: undefined,
      until: undefined,
      versions: [],
      clearStates: [],
      scoreFilters: [],
      missCountMin: undefined,
      missCountMax: undefined,
    });
  };

  const addScoreFilter = () => {
    updateLocal({
      scoreFilters: [
        ...(localParams.scoreFilters ?? []),
        {
          id: crypto.randomUUID(),
          metric: "scoreRate",
          operator: ">=",
          value: "",
        },
      ],
    });
  };

  const removeScoreFilter = (id: string) => {
    updateLocal({
      scoreFilters: (localParams.scoreFilters ?? []).filter((f) => f.id !== id),
    });
  };

  const updateScoreFilter = (
    id: string,
    updates: Partial<ScoreFilterCondition>,
  ) => {
    updateLocal({
      scoreFilters: (localParams.scoreFilters ?? []).map((f) =>
        f.id === id ? { ...f, ...updates } : f,
      ),
    });
  };

  const toggleState = (val: string) => {
    const current = localParams.clearStates || [];
    const next = current.includes(val)
      ? current.filter((i) => i !== val)
      : [...current, val];
    updateLocal({ clearStates: next });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl border-bpim-border p-6 text-bpim-text">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">
            詳細フィルター
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4 overflow-y-auto max-h-[70vh] pr-2 scrollbar-thin">
          <section className="flex flex-col gap-3">
            <h3 className="text-[10px] font-bold tracking-widest text-bpim-text uppercase">
              BPM範囲
            </h3>
            <div className="flex items-center gap-3">
              <Input
                placeholder="Min"
                type="number"
                className="h-9 border-bpim-border bg-bpim-surface-2/60"
                value={localParams.bpmMin ?? ""}
                onChange={(e) =>
                  updateLocal({
                    bpmMin: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
              <span className="text-bpim-subtle">~</span>
              <Input
                placeholder="Max"
                type="number"
                className="h-9 border-bpim-border bg-bpim-surface-2/60"
                value={localParams.bpmMax ?? ""}
                onChange={(e) =>
                  updateLocal({
                    bpmMax: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isSofran"
                checked={!!localParams.isSofran}
                onCheckedChange={(checked) =>
                  updateLocal({ isSofran: !!checked })
                }
              />
              <Label htmlFor="isSofran" className="text-sm font-medium">
                ソフラン曲のみ表示
              </Label>
            </div>
          </section>

          <Separator className="bg-bpim-surface-2/60" />

          <section className="flex flex-col gap-3">
            <h3 className="text-[10px] font-bold tracking-widest text-bpim-text uppercase">
              ランプ状態
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {CLEAR_STATES.map((state) => (
                <div key={state.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`state-${state.value}`}
                    checked={localParams.clearStates?.includes(state.value)}
                    onCheckedChange={() => toggleState(state.value)}
                  />
                  <Label
                    htmlFor={`state-${state.value}`}
                    className="text-xs font-bold"
                    style={{ color: state.color }}
                  >
                    {state.label}
                  </Label>
                </div>
              ))}
            </div>
          </section>

          <Separator className="bg-bpim-surface-2/60" />

          <section className="flex flex-col gap-3">
            <h3 className="text-[10px] font-bold tracking-widest text-bpim-text uppercase">
              最終更新日
            </h3>
            <div className="flex flex-wrap gap-2">
              {periodOptions.map((opt) => (
                <Button
                  key={opt.value}
                  size="xs"
                  variant={
                    localParams.since === opt.value ? "default" : "outline"
                  }
                  className={cn(
                    "h-7 px-2 rounded-full border-bpim-border",
                    localParams.since === opt.value
                      ? "bg-bpim-primary"
                      : "bg-transparent text-bpim-muted",
                  )}
                  onClick={() =>
                    updateLocal({
                      since:
                        localParams.since === opt.value
                          ? undefined
                          : (opt.value as any),
                      until: undefined,
                    })
                  }
                >
                  {opt.label}
                </Button>
              ))}
              <Button
                size="xs"
                variant={isCustomActive ? "default" : "outline"}
                className={cn(
                  "h-7 px-2 rounded-full border-bpim-border",
                  isCustomActive
                    ? "bg-bpim-primary"
                    : "bg-transparent text-bpim-muted",
                )}
                onClick={() => {
                  if (isCustomActive) {
                    updateLocal({ since: undefined, until: undefined });
                  } else {
                    const today = dayjs().tz().format("YYYY-MM-DD");
                    updateLocal({ since: today, until: today });
                  }
                }}
              >
                カスタム
              </Button>
            </div>

            {isCustomActive && (
              <div className="flex flex-col gap-3 rounded-lg bg-bpim-surface-2/60 p-3">
                <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[10px] text-bpim-muted">
                      開始日
                    </Label>
                    <Input
                      type="date"
                      className="h-8 border-bpim-border bg-bpim-bg text-xs [color-scheme:dark]"
                      value={localParams.since || ""}
                      onChange={(e) => updateLocal({ since: e.target.value })}
                    />
                  </div>
                  <span className="mb-2 text-bpim-subtle text-xs">~</span>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[10px] text-bpim-muted">
                      終了日
                    </Label>
                    <Input
                      type="date"
                      className="h-8 border-bpim-border bg-bpim-bg text-xs [color-scheme:dark]"
                      value={localParams.until || ""}
                      onChange={(e) => updateLocal({ until: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}
          </section>

          <Separator className="bg-bpim-surface-2/60" />

          <section className="flex flex-col gap-3">
            <h3 className="text-[10px] font-bold tracking-widest text-bpim-text uppercase">
              楽曲バージョン
            </h3>
            <ScrollArea className="h-[200px] w-full pr-4">
              <div className="grid grid-cols-2 gap-2">
                {verNameArr.map((name, index) => {
                  if (!name) return null;
                  const isChecked = localParams.versions?.includes(index);
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <Checkbox
                        id={`ver-${index}`}
                        checked={isChecked}
                        onCheckedChange={() => {
                          const current = localParams.versions || [];
                          const next = isChecked
                            ? current.filter((i) => i !== index)
                            : [...current, index];
                          updateLocal({ versions: next });
                        }}
                      />
                      <Label
                        htmlFor={`ver-${index}`}
                        className="text-xs truncate"
                      >
                        {name}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </section>

          <Separator className="bg-bpim-surface-2/60" />

          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <h3 className="text-[10px] font-bold tracking-widest text-bpim-text uppercase">
                スコア条件
              </h3>
              <button
                onClick={addScoreFilter}
                className="flex items-center gap-1 text-[10px] font-bold text-bpim-primary hover:text-bpim-primary/70 transition-colors"
              >
                <Plus className="h-3 w-3" />
                追加
              </button>
            </div>

            {(localParams.scoreFilters ?? []).length > 0 && (
              <div className="flex flex-col gap-2">
                {(localParams.scoreFilters ?? []).map((f) => (
                  <div key={f.id} className="flex flex-wrap items-center gap-2">
                    <Select
                      value={f.metric}
                      onValueChange={(v) =>
                        updateScoreFilter(f.id, {
                          metric: v as ScoreFilterCondition["metric"],
                          value: "",
                        })
                      }
                    >
                      <SelectTrigger className="h-8 w-28 border-bpim-border bg-bpim-surface-2/60 text-xs text-bpim-text">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-bpim-border bg-bpim-bg">
                        <SelectItem value="scoreRate" className="text-xs">
                          スコアレート
                        </SelectItem>
                        <SelectItem value="djrank" className="text-xs">
                          DJRANK
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <span className="text-xs text-bpim-muted">が</span>

                    {f.metric === "djrank" ? (
                      <Select
                        value={f.value}
                        onValueChange={(v) =>
                          updateScoreFilter(f.id, { value: v })
                        }
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
                        value={f.value}
                        onChange={(e) =>
                          updateScoreFilter(f.id, { value: e.target.value })
                        }
                        placeholder="0-100"
                        className="h-8 w-24 border-bpim-border bg-bpim-surface-2/60 text-xs text-bpim-text placeholder:text-bpim-muted"
                        type="number"
                        min={0}
                        max={100}
                      />
                    )}

                    <Select
                      value={f.operator}
                      onValueChange={(v) =>
                        updateScoreFilter(f.id, {
                          operator: v as ScoreFilterCondition["operator"],
                        })
                      }
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
                      onClick={() => removeScoreFilter(f.id)}
                      className="text-bpim-muted hover:text-red-400 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <Separator className="bg-bpim-surface-2/60" />

          <section className="flex flex-col gap-3">
            <h3 className="text-[10px] font-bold tracking-widest text-bpim-text uppercase">
              ミスカウント
            </h3>
            <div className="flex items-center gap-3">
              <Input
                placeholder="以上"
                type="number"
                min={0}
                className="h-9 border-bpim-border bg-bpim-surface-2/60"
                value={localParams.missCountMin ?? ""}
                onChange={(e) =>
                  updateLocal({
                    missCountMin: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
              />
              <span className="text-bpim-subtle">~</span>
              <Input
                placeholder="以下"
                type="number"
                min={0}
                className="h-9 border-bpim-border bg-bpim-surface-2/60"
                value={localParams.missCountMax ?? ""}
                onChange={(e) =>
                  updateLocal({
                    missCountMax: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
              />
            </div>
          </section>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-bpim-muted"
          >
            リセット
          </Button>
          <Button
            className="bg-bpim-primary font-bold hover:bg-bpim-primary"
            size="sm"
            onClick={handleApply}
          >
            適用して閉じる
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
