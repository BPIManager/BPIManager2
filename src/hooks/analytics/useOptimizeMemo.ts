import useSWR, { useSWRConfig } from "swr";
import { useCallback, useMemo, useState } from "react";
import { User as FirebaseUser } from "firebase/auth";
import type { OptimizationResult } from "@/types/bpi-optimizer";
import { fetcher } from "@/utils/common/fetch";

export interface OptimizeMemo {
  reportId: string;
  userId: string;
  targetBpi: number;
  reportData: OptimizationResult;
  createdAt: string;
}

export const useBpiOptimizerMemos = (
  userId?: string,
  fbUser?: FirebaseUser | null,
) => {
  const { mutate } = useSWRConfig();
  const apiUrl = `/api/v1/users/${userId}/optimizeMemo`;
  // キャッシュキーにはFirebase Userオブジェクト全体でなくuidのみを使う
  // (fbUser自体はクロージャ経由でfetcherに渡す)
  const swrKey = useMemo<[string, string | null] | null>(
    () => (userId ? [apiUrl, fbUser?.uid ?? null] : null),
    [userId, apiUrl, fbUser],
  );

  const { data: memos, isLoading: isMemosLoading } = useSWR<OptimizeMemo[]>(
    swrKey,
    () => fetcher([apiUrl, fbUser ?? null]),
  );

  const [isSaving, setIsSaving] = useState(false);
  const saveMemo = useCallback(
    async (targetBpi: number, reportData: OptimizationResult) => {
      if (!userId) return;
      setIsSaving(true);
      try {
        const token = fbUser ? await fbUser.getIdToken() : null;
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ targetBpi, reportData }),
        });
        if (!res.ok) throw new Error("Failed to save memo");

        await mutate(swrKey);
      } finally {
        setIsSaving(false);
      }
    },
    [userId, apiUrl, fbUser, swrKey, mutate],
  );

  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const deleteMemo = useCallback(
    async (reportId: string) => {
      if (!userId) return;
      setIsDeleting(reportId);
      try {
        const token = fbUser ? await fbUser.getIdToken() : null;
        const res = await fetch(`${apiUrl}/${reportId}`, {
          method: "DELETE",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) throw new Error("Failed to delete memo");

        await mutate(
          swrKey,
          (currentMemos: OptimizeMemo[] | undefined) => {
            return currentMemos?.filter((m) => m.reportId !== reportId);
          },
          false,
        );
      } finally {
        setIsDeleting(null);
      }
    },
    [userId, apiUrl, fbUser, swrKey, mutate],
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
