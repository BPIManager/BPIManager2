import { User as FirebaseUser } from "firebase/auth";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { authFetch } from "@/utils/common/fetch";
import { unwrapApiResponse } from "@/services/swr/fetchV2";

export async function requestFollowUser(
  targetUserId: string,
  isFollowing: boolean,
  fbUser: FirebaseUser,
): Promise<{ success: boolean; isFollowing: boolean; message: string }> {
  const method = isFollowing ? "DELETE" : "PUT";

  const res = await authFetch(
    `${API_V2_PREFIX}/users/${targetUserId}/follows`,
    method,
    fbUser,
  );

  if (!res.ok) throw new Error(`Failed to ${method} follow`);

  return unwrapApiResponse(res);
}
