import React, { createContext, useContext, useState, ReactNode } from "react";
import {
  IIDX_LEVELS,
  IIDX_DIFFICULTIES,
  BPI_CALCABLE_LEVELS,
  BPI_CALCABLE_DIFFICULTIES,
} from "@/constants/diffs";
import { latestVersion } from "@/constants/latestVersion";

interface FilterContextType {
  levels: string[];
  diffs: string[];
  version: string;
  compareVersion: string;
  toggleLevel: (val: string) => void;
  toggleDiff: (val: string) => void;
  setVersion: (val: string) => void;
  setCompareVersion: (val: string) => void;
  resetFilters: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const [levels, setLevels] = useState<BPI_CALCABLE_LEVELS[]>(["12"]);
  const [diffs, setDiffs] = useState<BPI_CALCABLE_DIFFICULTIES[]>(
    IIDX_DIFFICULTIES as BPI_CALCABLE_DIFFICULTIES[],
  );
  const [version, setVersion] = useState<string>(latestVersion);
  const [compareVersion, setCompareVersion] = useState<string>("");

  const toggle = <T extends string>(
    val: T,
    set: React.Dispatch<React.SetStateAction<T[]>>,
  ) => {
    set((prev) =>
      prev.includes(val) ? prev.filter((i) => i !== val) : [...prev, val],
    );
  };

  const value = {
    levels,
    diffs,
    version,
    compareVersion,
    toggleLevel: (val: string) => toggle(val as BPI_CALCABLE_LEVELS, setLevels),
    toggleDiff: (val: string) =>
      toggle(val as BPI_CALCABLE_DIFFICULTIES, setDiffs),
    setVersion,
    setCompareVersion,
    resetFilters: () => {
      setLevels(IIDX_LEVELS as unknown as BPI_CALCABLE_LEVELS[]);
      setDiffs(IIDX_DIFFICULTIES as BPI_CALCABLE_DIFFICULTIES[]);
      setVersion(latestVersion);
      setCompareVersion("");
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
