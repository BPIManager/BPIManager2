import { User as FirebaseUser } from "firebase/auth";
import { API_PREFIX } from "@/constants/logic/apiEndpoints";
import { authFetch } from "@/utils/common/fetch";

export async function markNotificationsRead(fbUser: FirebaseUser) {
  await authFetch(`${API_PREFIX}/users/${fbUser.uid}/notifications`, "POST", fbUser);
}
