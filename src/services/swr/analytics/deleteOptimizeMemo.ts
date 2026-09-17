import { User as FirebaseUser } from "firebase/auth";
import { authFetch } from "@/utils/common/fetch";

export async function deleteOptimizeMemo(
  apiUrl: string,
  fbUser: FirebaseUser | null | undefined,
  reportId: string,
) {
  const res = await authFetch(`${apiUrl}/${reportId}`, "DELETE", fbUser ?? null);
  if (!res.ok) throw new Error("Failed to delete memo");
}
