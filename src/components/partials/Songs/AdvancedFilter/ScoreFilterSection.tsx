"use client";

import { FilterParamsFrontend, ScoreFilterCondition } from "@/types/songs/score";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { SectionTitle } from "./SectionTitle";
import { useTranslation } from "@/hooks/common/useTranslation";

const DJRANK_OPTIONS = ["MAX-", "AAA", "AA", "A", "B", "C", "D", "E", "F"] as const;

interface Props {
  scoreFilters: ScoreFilterCondition[] | undefined;
  onChange: (val: Partial<FilterParamsFrontend>) => void;
}

export const ScoreFilterSection = ({ scoreFilters, onChange }: Props) => {
  const { t } = useTranslation();
  const filters = scoreFilters ?? [];

  const add = () => {
    onChange({
      scoreFilters: [
        ...filters,
        { id: crypto.randomUUID(), metric: "scoreRate", operator: ">=", value: "" },
      ],
    });
  };

  const remove = (id: string) => {
    onChange({ scoreFilters: filters.filter((f) => f.id !== id) });
  };

  const update = (id: string, updates: Partial<ScoreFilterCondition>) => {
    onChange({ scoreFilters: filters.map((f) => (f.id === id ? { ...f, ...updates } : f)) });
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <SectionTitle>{t("filter.scoreCondition")}</SectionTitle>
        <button
          onClick={add}
          className="flex items-center gap-1 text-[10px] font-bold text-bpim-primary hover:text-bpim-primary/70 transition-colors"
        >
          <Plus className="h-3 w-3" />
          {t("filter.scoreConditionAdd")}
        </button>
      </div>

      {filters.length > 0 && (
        <div className="flex flex-col gap-2">
          {filters.map((f) => (
            <div key={f.id} className="flex flex-wrap items-center gap-2">
              <Select
                value={f.metric}
                onValueChange={(v) =>
                  update(f.id, { metric: v as ScoreFilterCondition["metric"], value: "" })
                }
              >
                <SelectTrigger className="h-8 w-28 border-bpim-border bg-bpim-surface-2/60 text-xs text-bpim-text">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-bpim-border bg-bpim-bg">
                  <SelectItem value="scoreRate" className="text-xs">{t("filter.scoreRate")}</SelectItem>
                  <SelectItem value="djrank" className="text-xs">DJRANK</SelectItem>
                </SelectContent>
              </Select>

              <span className="text-xs text-bpim-muted">{t("filter.scoreConditionParticle")}</span>

              {f.metric === "djrank" ? (
                <Select value={f.value} onValueChange={(v) => update(f.id, { value: v })}>
                  <SelectTrigger className="h-8 w-20 border-bpim-border bg-bpim-surface-2/60 text-xs text-bpim-text">
                    <SelectValue placeholder={t("filter.rank")} />
                  </SelectTrigger>
                  <SelectContent className="border-bpim-border bg-bpim-bg">
                    {DJRANK_OPTIONS.map((r) => (
                      <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={f.value}
                  onChange={(e) => update(f.id, { value: e.target.value })}
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
                  update(f.id, { operator: v as ScoreFilterCondition["operator"] })
                }
              >
                <SelectTrigger className="h-8 w-16 border-bpim-border bg-bpim-surface-2/60 text-xs text-bpim-text">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-bpim-border bg-bpim-bg">
                  <SelectItem value=">=" className="text-xs">{t("filter.orMore")}</SelectItem>
                  <SelectItem value="<=" className="text-xs">{t("filter.orLess")}</SelectItem>
                </SelectContent>
              </Select>

              <button
                onClick={() => remove(f.id)}
                className="text-bpim-muted hover:text-red-400 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
