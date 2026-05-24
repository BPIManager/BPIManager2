"use client";

import { FilterParamsFrontend } from "@/types/songs/score";
import dayjs from "@/lib/dayjs";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionTitle } from "./SectionTitle";

const PERIOD_OPTIONS = [
  { label: "今日", value: "today" },
  { label: "昨日", value: "yesterday" },
  { label: "今週", value: "thisWeek" },
  { label: "今月", value: "thisMonth" },
  { label: "直近7日", value: "past7" },
  { label: "直近30日", value: "past30" },
];

interface Props {
  since: string | undefined;
  until: string | undefined;
  onChange: (val: Partial<FilterParamsFrontend>) => void;
}

export const DateSection = ({ since, until, onChange }: Props) => {
  const isCustomActive = since && !PERIOD_OPTIONS.find((v) => v.value === since);

  return (
    <section className="flex flex-col gap-3">
      <SectionTitle>最終更新日</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {PERIOD_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            size="xs"
            variant={since === opt.value ? "default" : "outline"}
            className={cn(
              "h-7 px-2 rounded-full border-bpim-border",
              since === opt.value ? "bg-bpim-primary" : "bg-transparent text-bpim-muted",
            )}
            onClick={() =>
              onChange({
                since: since === opt.value ? undefined : (opt.value as FilterParamsFrontend["since"]),
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
            isCustomActive ? "bg-bpim-primary" : "bg-transparent text-bpim-muted",
          )}
          onClick={() => {
            if (isCustomActive) {
              onChange({ since: undefined, until: undefined });
            } else {
              const today = dayjs().tz().format("YYYY-MM-DD");
              onChange({ since: today, until: today });
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
              <Label className="text-[10px] text-bpim-muted">開始日</Label>
              <Input
                type="date"
                className="h-8 border-bpim-border bg-bpim-bg text-xs scheme-dark"
                value={since || ""}
                onChange={(e) => onChange({ since: e.target.value })}
              />
            </div>
            <span className="mb-2 text-bpim-subtle text-xs">~</span>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[10px] text-bpim-muted">終了日</Label>
              <Input
                type="date"
                className="h-8 border-bpim-border bg-bpim-bg text-xs scheme-dark"
                value={until || ""}
                onChange={(e) => onChange({ until: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
