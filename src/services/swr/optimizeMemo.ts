import { User as FirebaseUser } from "firebase/auth";
import type { OptimizationResult } from "@/types/bpi-optimizer";
import { authFetch } from "@/utils/common/fetch";

export async function saveOptimizeMemo(
  apiUrl: string,
  fbUser: FirebaseUser | null | undefined,
  targetBpi: number,
  reportData: OptimizationResult,
) {
  const res = await authFetch(apiUrl, "POST", fbUser ?? null, {
    targetBpi,
    reportData,
  });
  if (!res.ok) throw new Error("Failed to save memo");
}

export async function deleteOptimizeMemo(
  apiUrl: string,
  fbUser: FirebaseUser | null | undefined,
  reportId: string,
) {
  const res = await authFetch(`${apiUrl}/${reportId}`, "DELETE", fbUser ?? null);
  if (!res.ok) throw new Error("Failed to delete memo");
}
