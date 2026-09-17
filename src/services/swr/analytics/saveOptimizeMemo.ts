import { User as FirebaseUser } from "firebase/auth";
import type { OptimizationResult } from "@/types/bpi-optimizer";
import { authFetch } from "@/utils/common/fetch";

export async function saveOptimizeMemo(
  apiUrl: string,
  fbUser: FirebaseUser | null | undefined,
  targetBpi: number,
  reportData: OptimizationResult,
  kind: "auto" | "custom" = "auto",
) {
  const res = await authFetch(apiUrl, "POST", fbUser ?? null, {
    targetBpi,
    reportData,
    kind,
  });
  if (!res.ok) throw new Error("Failed to save memo");
}
