import React, { createContext, useContext, useState, ReactNode } from "react";
import { IIDX_LEVELS, IIDX_DIFFICULTIES } from "@/constants/diffs";

interface FilterContextType {
  levels: string[];
  diffs: string[];
  toggleLevel: (val: string) => void;
  toggleDiff: (val: string) => void;
  resetFilters: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const [levels, setLevels] = useState<string[]>(
    IIDX_LEVELS as unknown as string[],
  );
  const [diffs, setDiffs] = useState<string[]>(
    IIDX_DIFFICULTIES as unknown as string[],
  );

  const toggle = (
    curr: string[],
    val: string,
    set: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    set((prev) =>
      prev.includes(val) ? prev.filter((i) => i !== val) : [...prev, val],
    );
  };

  const value = {
    levels,
    diffs,
    toggleLevel: (val: string) => toggle(levels, val, setLevels),
    toggleDiff: (val: string) => toggle(diffs, val, setDiffs),
    resetFilters: () => {
      setLevels(IIDX_LEVELS as unknown as string[]);
      setDiffs(IIDX_DIFFICULTIES as unknown as string[]);
    },
  };

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  );
};

export const useStatsFilter = () => {
  const context = useContext(FilterContext);
  if (!context)
    throw new Error("useStatsFilter must be used within a FilterProvider");
  return context;
};
