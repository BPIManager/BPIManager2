import { User as FirebaseUser } from "firebase/auth";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { authFetch } from "@/utils/common/fetch";
import { unwrapApiResponse } from "@/services/swr/fetchV2";

export interface BatchImportResult {
  success: boolean;
  batchId: string;
  updatedAllCount: number;
  updatedBpiCount: number;
  previousTotalBpi: number;
  newTotalBpi: number;
  details: { notFound: { title: string; difficulty: string }[] };
}

export async function submitBatchImport(
  userId: string,
  fbUser: FirebaseUser,
  version: string,
  csvRows: unknown[],
): Promise<BatchImportResult> {
  const response = await authFetch(
    `${API_V2_PREFIX}/users/${userId}/scores/bulk`,
    "POST",
    fbUser,
    { version, csvRows },
    true,
  );

  return unwrapApiResponse<BatchImportResult>(response);
}
