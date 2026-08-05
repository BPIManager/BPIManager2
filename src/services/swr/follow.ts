import { User as FirebaseUser } from "firebase/auth";
import { API_PREFIX } from "@/constants/logic/apiEndpoints";

export async function requestFollowUser(
  targetUserId: string,
  isFollowing: boolean,
  fbUser: FirebaseUser,
) {
  const token = await fbUser.getIdToken();
  const method = isFollowing ? "DELETE" : "PUT";

  const res = await fetch(`${API_PREFIX}/users/${targetUserId}/follows`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) throw new Error(`Failed to ${method} follow`);

  return res.json();
}
