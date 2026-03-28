"use client";

import { useState, ReactNode } from "react";
import { Search, Pin, PinOff, Loader } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useDebouncedSearch } from "@/hooks/common/useDebouncedSearch";

export const FilterSearchInput = ({
  value,
  onChange,
  placeholder = "曲名で検索...",
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) => {
  const { localSearch, setLocalSearch, isTyping } = useDebouncedSearch(
    value,
    onChange,
  );

  return (
    <div className="relative flex-1 h-9">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-bpim-muted pointer-events-none">
        <Search size={16} />
      </div>
      <Input
        placeholder={placeholder}
        className="h-9 pl-10 pr-10 border-bpim-border bg-bpim-surface-2/60 text-[16px] md:text-xs placeholder:text-xs focus-visible:ring-gray-500"
        value={localSearch}
        onChange={(e) => setLocalSearch(e.target.value)}
      />
      {isTyping && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Loader className="animate-spin text-bpim-text" size={14} />
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

export const FilterBarContainer = ({
  totalCount,
  children,
}: {
  totalCount: number;
  children: ReactNode;
}) => {
  const [isSticky, setIsSticky] = useState(true);
  return (
    <div
      className={cn(
        "px-4 pt-4 pb-2 border-b border-bpim-border transition-all duration-200 w-full",
        isSticky ? "sticky top-0 z-50 bg-bpim-bg" : "relative bg-bpim-bg",
      )}
    >
      {children}
      <div className="flex items-center justify-between h-6 mt-2">
        <span className="text-xs font-bold text-bpim-text leading-none">
          {totalCount.toLocaleString()}曲
        </span>
        <FilterStickyToggle isSticky={isSticky} onToggle={setIsSticky} />
      </div>
    </div>
  );
};
