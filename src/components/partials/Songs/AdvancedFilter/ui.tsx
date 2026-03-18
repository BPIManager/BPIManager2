"use client";

import { useState, useEffect } from "react";
import { FilterParamsFrontend } from "@/types/songs/withScore";
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
      <DialogContent className="max-w-md border-white/10 bg-slate-950 p-6 text-white">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">
            詳細フィルター
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4 overflow-y-auto max-h-[70vh] pr-2 scrollbar-thin">
          <section className="flex flex-col gap-3">
            <h3 className="text-[10px] font-bold tracking-widest text-blue-500 uppercase">
              BPM範囲
            </h3>
            <div className="flex items-center gap-3">
              <Input
                placeholder="Min"
                type="number"
                className="h-9 border-white/10 bg-white/5"
                value={localParams.bpmMin ?? ""}
                onChange={(e) =>
                  updateLocal({
                    bpmMin: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
              <span className="text-slate-600">~</span>
              <Input
                placeholder="Max"
                type="number"
                className="h-9 border-white/10 bg-white/5"
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

          <Separator className="bg-white/5" />

          <section className="flex flex-col gap-3">
            <h3 className="text-[10px] font-bold tracking-widest text-blue-500 uppercase">
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

          <Separator className="bg-white/5" />

          <section className="flex flex-col gap-3">
            <h3 className="text-[10px] font-bold tracking-widest text-blue-500 uppercase">
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
                    "h-7 px-2 rounded-full border-white/10",
                    localParams.since === opt.value
                      ? "bg-blue-600"
                      : "bg-transparent text-slate-400",
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
                  "h-7 px-2 rounded-full border-white/10",
                  isCustomActive
                    ? "bg-blue-600"
                    : "bg-transparent text-slate-400",
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
              <div className="flex flex-col gap-3 rounded-lg bg-white/5 p-3">
                <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[10px] text-slate-500">開始日</Label>
                    <Input
                      type="date"
                      className="h-8 border-white/10 bg-slate-900 text-xs [color-scheme:dark]"
                      value={localParams.since || ""}
                      onChange={(e) => updateLocal({ since: e.target.value })}
                    />
                  </div>
                  <span className="mb-2 text-slate-600 text-xs">~</span>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[10px] text-slate-500">終了日</Label>
                    <Input
                      type="date"
                      className="h-8 border-white/10 bg-slate-900 text-xs [color-scheme:dark]"
                      value={localParams.until || ""}
                      onChange={(e) => updateLocal({ until: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}
          </section>

          <Separator className="bg-white/5" />

          <section className="flex flex-col gap-3">
            <h3 className="text-[10px] font-bold tracking-widest text-blue-500 uppercase">
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
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-slate-400"
          >
            リセット
          </Button>
          <Button
            className="bg-blue-600 font-bold hover:bg-blue-500"
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
