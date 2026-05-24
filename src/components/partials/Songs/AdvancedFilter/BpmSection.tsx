"use client";

import { FilterParamsFrontend } from "@/types/songs/score";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionTitle } from "./SectionTitle";

interface Props {
  bpmMin: number | undefined;
  bpmMax: number | undefined;
  isSofran: boolean | undefined;
  onChange: (val: Partial<FilterParamsFrontend>) => void;
}

export const BpmSection = ({ bpmMin, bpmMax, isSofran, onChange }: Props) => (
  <section className="flex flex-col gap-3">
    <SectionTitle>BPM範囲</SectionTitle>
    <div className="flex items-center gap-3">
      <Input
        placeholder="Min"
        type="number"
        className="h-9 border-bpim-border bg-bpim-surface-2/60"
        value={bpmMin ?? ""}
        onChange={(e) => onChange({ bpmMin: e.target.value ? Number(e.target.value) : undefined })}
      />
      <span className="text-bpim-subtle">~</span>
      <Input
        placeholder="Max"
        type="number"
        className="h-9 border-bpim-border bg-bpim-surface-2/60"
        value={bpmMax ?? ""}
        onChange={(e) => onChange({ bpmMax: e.target.value ? Number(e.target.value) : undefined })}
      />
    </div>
    <div className="flex items-center gap-2">
      <Checkbox
        id="isSofran"
        checked={!!isSofran}
        onCheckedChange={(checked) => onChange({ isSofran: !!checked })}
      />
      <Label htmlFor="isSofran" className="text-sm font-medium">
        ソフラン曲のみ表示
      </Label>
    </div>
  </section>
);
