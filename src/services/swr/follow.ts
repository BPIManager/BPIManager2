import { User as FirebaseUser } from "firebase/auth";
import { API_PREFIX } from "@/constants/logic/apiEndpoints";
import { authFetch } from "@/utils/common/fetch";

export async function requestFollowUser(
  targetUserId: string,
  isFollowing: boolean,
  fbUser: FirebaseUser,
) {
  const method = isFollowing ? "DELETE" : "PUT";

  const res = await authFetch(
    `${API_PREFIX}/users/${targetUserId}/follows`,
    method,
    fbUser,
  );

  if (!res.ok) throw new Error(`Failed to ${method} follow`);

  return res.json();
}
