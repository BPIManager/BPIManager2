import { User as FirebaseUser } from "firebase/auth";
import { API_PREFIX } from "@/constants/logic/apiEndpoints";

export async function markNotificationsRead(fbUser: FirebaseUser) {
  await fetch(`${API_PREFIX}/users/${fbUser.uid}/notifications`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await fbUser.getIdToken()}` },
  });
}
