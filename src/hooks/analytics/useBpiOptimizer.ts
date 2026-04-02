import { useState, useCallback, useEffect } from "react";
import useSWR from "swr";
import { useUser } from "@/contexts/users/UserContext";
import { fetcher } from "@/utils/common/fetch";
import { API_PREFIX } from "@/constants/apiEndpoints";
import { latestVersion } from "@/constants/latestVersion";
import type {
  OptimizationResult,
  OptimizerStrategy,
} from "@/types/bpi-optimizer";
import { toast } from "sonner";

const DEFAULT_STRATEGIES: OptimizerStrategy[] = ["unplayed", "played"];
const DEFAULT_LEVELS = ["11", "12"];
const DEFAULT_DIFFICULTIES = ["HYPER", "ANOTHER", "LEGGENDARIA"];

export type { OptimizerStrategy };

export function useBpiOptimizer() {
  const { fbUser, user } = useUser();

  const [targetBpiInput, setTargetBpiInput] = useState<string>("");
  const [searchMode, setSearchMode] = useState<"fastest" | "flexible">(
    "flexible",
  );
  const [committedSearchMode, setCommittedSearchMode] = useState<
    "fastest" | "flexible" | null
  >(null);
  const [committedTargetBpi, setCommittedTargetBpi] = useState<number | null>(
    null,
  );
  const [committedMaxSteps, setCommittedMaxSteps] = useState<number | null>(
    null,
  );

  const [result, setResult] = useState<OptimizationResult | null>(null);

  const [strategies, setStrategies] =
    useState<OptimizerStrategy[]>(DEFAULT_STRATEGIES);
  const [levels, setLevels] = useState<string[]>(DEFAULT_LEVELS);
  const [difficulties, setDifficulties] =
    useState<string[]>(DEFAULT_DIFFICULTIES);
  const [maxStepsInput, setMaxStepsInput] = useState<string>("30");
  const [considerCurrentTotalBpi, setConsiderCurrentTotalBpi] = useState(true);

  const userId = fbUser?.uid;

  const swrKey = (() => {
    if (!userId || !fbUser || committedTargetBpi === null) return null;
    const params = new URLSearchParams({
      targetBpi: String(committedTargetBpi),
      maxSteps: String(committedMaxSteps ?? 30),
      searchMode: committedSearchMode ?? "flexible",
      strategies: strategies.join(","),
      levels: levels.join(","),
      difficulties: difficulties.join(","),
      considerCurrentTotalBpi: String(considerCurrentTotalBpi),
    });
    return [
      `${API_PREFIX}/users/${userId}/analytics/bpi-optimizer?${params}`,
      fbUser,
    ];
  })();

  useEffect(() => {
    if (user?.totalBpi !== undefined && targetBpiInput === "") {
      const current = Number(user.totalBpi);
      setTargetBpiInput((current + 1).toFixed(2));
    }
  }, [user?.totalBpi, targetBpiInput]);

  const {
    data: _data,
    error,
    isLoading,
    mutate,
  } = useSWR<OptimizationResult>(swrKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    shouldRetryOnError: false,
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (err) => {
      toast.error("計算に失敗しました", {
        description:
          "条件を調整して再度お試しください。\n" + JSON.stringify(err.message),
      });
      setCommittedTargetBpi(null);
    },
  });

  const handleSubmit = useCallback(() => {
    const valBpi = parseFloat(targetBpiInput);
    const valSteps = parseInt(maxStepsInput);

    if (!isNaN(valBpi) && valBpi >= -15 && valBpi <= 100) {
      setCommittedTargetBpi(valBpi);
      setCommittedMaxSteps(!isNaN(valSteps) ? valSteps : 30);
      setCommittedSearchMode(searchMode);
      mutate();
    }
  }, [targetBpiInput, maxStepsInput, searchMode, mutate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleSubmit();
    },
    [handleSubmit],
  );

  const toggleStrategy = useCallback((s: OptimizerStrategy) => {
    setStrategies((prev) => {
      const next = prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s];
      // 「得意曲を伸ばす」を選択したら未プレイ・既プレイも自動的に有効化
      if (s === "radar-priority" && !prev.includes("radar-priority")) {
        const withBoth = new Set([...next, "unplayed" as OptimizerStrategy, "played" as OptimizerStrategy]);
        return Array.from(withBoth);
      }
      return next;
    });
    setCommittedTargetBpi(null);
  }, []);

  const toggleLevel = useCallback((level: string) => {
    setLevels((prev) =>
      prev.includes(level) ? prev.filter((x) => x !== level) : [...prev, level],
    );
    setCommittedTargetBpi(null);
  }, []);

  const toggleDifficulty = useCallback((diff: string) => {
    setDifficulties((prev) =>
      prev.includes(diff) ? prev.filter((x) => x !== diff) : [...prev, diff],
    );
    setCommittedTargetBpi(null);
  }, []);

  const inputError =
    targetBpiInput !== "" &&
    (isNaN(parseFloat(targetBpiInput)) ||
      parseFloat(targetBpiInput) < -15 ||
      parseFloat(targetBpiInput) > 100);

  return {
    targetBpiInput,
    setTargetBpiInput,
    committedTargetBpi,
    strategies,
    levels,
    difficulties,
    maxStepsInput,
    setMaxStepsInput,
    searchMode,
    setSearchMode,
    handleSubmit,
    handleKeyDown,
    toggleStrategy,
    toggleLevel,
    toggleDifficulty,
    result,
    setResult,
    isLoading,
    isError: !!error,
    inputError,
    version: latestVersion,
    considerCurrentTotalBpi,
    setConsiderCurrentTotalBpi,
  };
}
