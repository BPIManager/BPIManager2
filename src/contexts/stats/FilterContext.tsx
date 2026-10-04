import React, { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";
import {
  IIDX_DIFFICULTIES,
  BPI_CALCABLE_LEVELS,
  BPI_CALCABLE_DIFFICULTIES,
} from "@/constants/iidx/bpiDifficulties";
import { latestVersion } from "@/constants/iidx/iidxVersions";

interface FilterContextType {
  levels: string[];
  diffs: string[];
  version: string;
  compareVersion: string;
  toggleLevel: (val: string) => void;
  toggleDiff: (val: string) => void;
  setVersion: (val: string) => void;
  setCompareVersion: (val: string) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const [levels, setLevels] = useState<BPI_CALCABLE_LEVELS[]>(["12"]);
  const [diffs, setDiffs] = useState<BPI_CALCABLE_DIFFICULTIES[]>(
    IIDX_DIFFICULTIES as BPI_CALCABLE_DIFFICULTIES[],
  );
  const [version, setVersion] = useState<string>(latestVersion);
  const [compareVersion, setCompareVersion] = useState<string>("");

  const toggle = useCallback(
    <T extends string>(val: T, set: React.Dispatch<React.SetStateAction<T[]>>) => {
      set((prev) =>
        prev.includes(val) ? prev.filter((i) => i !== val) : [...prev, val],
      );
    },
    [],
  );

  const value = useMemo(
    () => ({
    levels,
    diffs,
    version,
    compareVersion,
    toggleLevel: (val: string) => toggle(val as BPI_CALCABLE_LEVELS, setLevels),
    toggleDiff: (val: string) =>
      toggle(val as BPI_CALCABLE_DIFFICULTIES, setDiffs),
    setVersion,
    setCompareVersion,
    }),
    [levels, diffs, version, compareVersion, toggle],
  );

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
