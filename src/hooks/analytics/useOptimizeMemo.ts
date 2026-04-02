import useSWR, { useSWRConfig } from "swr";
import { useCallback, useState } from "react";
import type { OptimizationResult } from "@/types/bpi-optimizer";

export interface OptimizeMemo {
  reportId: string;
  userId: string;
  targetBpi: number;
  reportData: OptimizationResult;
  createdAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const useBpiOptimizerMemos = (userId?: string) => {
  const { mutate } = useSWRConfig();
  const apiUrl = `/api/v1/users/${userId}/optimizeMemo`;

  const {
    data: memos,
    error,
    isLoading: isMemosLoading,
  } = useSWR<OptimizeMemo[]>(userId ? apiUrl : null, fetcher);

  const [isSaving, setIsSaving] = useState(false);
  const saveMemo = useCallback(
    async (targetBpi: number, reportData: OptimizationResult) => {
      if (!userId) return;
      setIsSaving(true);
      try {
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetBpi, reportData }),
        });
        if (!res.ok) throw new Error("Failed to save memo");

        await mutate(apiUrl);
      } finally {
        setIsSaving(false);
      }
    },
    [userId, apiUrl, mutate],
  );

  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const deleteMemo = useCallback(
    async (reportId: string) => {
      if (!userId) return;
      setIsDeleting(reportId);
      try {
        const res = await fetch(`${apiUrl}/${reportId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete memo");

        await mutate(
          apiUrl,
          (currentMemos: OptimizeMemo[] | undefined) => {
            return currentMemos?.filter((m) => m.reportId !== reportId);
          },
          false,
        );
      } finally {
        setIsDeleting(null);
      }
    },
    [userId, apiUrl, mutate],
  );

  return {
    memos,
    isMemosLoading,
    isSaving,
    isDeleting,
    saveMemo,
    deleteMemo,
  };
};
