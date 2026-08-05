import { User as FirebaseUser } from "firebase/auth";
import type { OptimizationResult } from "@/types/bpi-optimizer";

export async function saveOptimizeMemo(
  apiUrl: string,
  fbUser: FirebaseUser | null | undefined,
  targetBpi: number,
  reportData: OptimizationResult,
) {
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
}

export async function deleteOptimizeMemo(
  apiUrl: string,
  fbUser: FirebaseUser | null | undefined,
  reportId: string,
) {
  const token = fbUser ? await fbUser.getIdToken() : null;
  const res = await fetch(`${apiUrl}/${reportId}`, {
    method: "DELETE",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error("Failed to delete memo");
}
