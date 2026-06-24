"use client";

import { FilterParamsFrontend } from "@/types/songs/score";
import { CLEAR_STATES } from "@/constants/iidx/lampState";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SectionTitle } from "./SectionTitle";
import { useTranslation } from "@/hooks/common/useTranslation";

interface Props {
  clearStates: string[] | undefined;
  onChange: (val: Partial<FilterParamsFrontend>) => void;
}

export const ClearStateSection = ({ clearStates, onChange }: Props) => {
  const { t } = useTranslation();
  const toggle = (val: string) => {
    const current = clearStates || [];
    const next = current.includes(val) ? current.filter((i) => i !== val) : [...current, val];
    onChange({ clearStates: next });
  };

  return (
    <section className="flex flex-col gap-3">
      <SectionTitle>{t("filter.lampState")}</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        {CLEAR_STATES.map((state) => (
          <div key={state.value} className="flex items-center gap-2">
            <Checkbox
              id={`state-${state.value}`}
              checked={clearStates?.includes(state.value)}
              onCheckedChange={() => toggle(state.value)}
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
  );
};
