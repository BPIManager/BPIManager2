"use client";

import { useState, useEffect } from "react";
import { Search, Pin, PinOff, Loader } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const FilterSearchInput = ({
  value,
  onChange,
  placeholder = "曲名で検索...",
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) => {
  const [local, setLocal] = useState(value || "");
  const isTyping = local !== (value || "");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (local !== value) onChange(local);
    }, 500);
    return () => clearTimeout(timer);
  }, [local, onChange, value]);

  return (
    <div className="relative flex-1 w-full group">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-bpim-muted pointer-events-none">
        <Search size={14} />
      </div>

      <Input
        placeholder={placeholder}
        className="h-9 pl-9 pr-9 border-bpim-border bg-bpim-surface-2/60 focus-visible:ring-blue-500"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
      />

      {isTyping && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-bpim-text">
          <Loader size={14} className="animate-spin" />
        </div>
      )}
    </div>
  );
};

interface FilterCheckboxGroupProps<T> {
  label: string;
  items: T[];
  selected: T[] | undefined;
  onToggle: (item: T) => void;
  getLabel?: (item: T) => string | number;
}

export const FilterCheckboxGroup = <T extends string | number>({
  label,
  items,
  selected,
  onToggle,
  getLabel,
}: FilterCheckboxGroupProps<T>) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
      {label}
    </span>
    <div className="flex flex-row flex-wrap items-center gap-4">
      {items.map((item) => {
        const id = `filter-${label}-${item}`;
        return (
          <div key={String(item)} className="flex items-center gap-2">
            <Checkbox
              id={id}
              checked={selected?.includes(item)}
              onCheckedChange={() => onToggle(item)}
              className="h-4 w-4 border-bpim-border data-[state=checked]:bg-bpim-primary"
            />
            <Label
              htmlFor={id}
              className="text-xs font-bold text-bpim-text cursor-pointer select-none"
            >
              {getLabel ? getLabel(item) : item}
            </Label>
          </div>
        );
      })}
    </div>
  </div>
);

export const FilterStickyToggle = ({
  isSticky,
  onToggle,
}: {
  isSticky: boolean;
  onToggle: (val: boolean) => void;
}) => (
  <Button
    variant="ghost"
    size="icon"
    className={cn(
      "h-8 w-8 rounded-md transition-colors",
      isSticky
        ? "text-bpim-primary bg-bpim-primary/10"
        : "text-bpim-muted hover:text-bpim-text hover:bg-bpim-overlay/50",
    )}
    onClick={() => onToggle(!isSticky)}
  >
    {isSticky ? <Pin size={14} /> : <PinOff size={14} />}
  </Button>
);
