import { User as FirebaseUser } from "firebase/auth";
import { API_PREFIX } from "@/constants/logic/apiEndpoints";

export interface ArenaPrivacySettings {
  showArenaClass: boolean;
  showArenaRank: boolean;
  showArea: boolean;
  showGrade: boolean;
}

export async function fetchStatsPrivacy(
  fbUid: string,
  fbUser: FirebaseUser,
): Promise<{ statsPrivacy?: ArenaPrivacySettings } | null> {
  const token = await fbUser.getIdToken();
  const res = await fetch(`${API_PREFIX}/users/${fbUid}/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function checkUserNameAvailability(
  userName: string,
  fbUser: FirebaseUser | null | undefined,
  signal: AbortSignal,
): Promise<{ available: boolean; message?: string }> {
  const token = await fbUser?.getIdToken();
  const res = await fetch(
    `${API_PREFIX}/usernames/${encodeURIComponent(userName)}/availability`,
    {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    },
  );
  return res.json();
}

export interface EditProfileFormData {
  userName: string;
  iidxId: string;
  bio: string;
  isPublic: boolean;
  xId: string;
  profileImage: string;
}

export async function saveProfile(
  fbUid: string,
  fbUser: FirebaseUser,
  method: "PATCH" | "POST",
  formData: EditProfileFormData,
  arenaPrivacy: ArenaPrivacySettings,
) {
  const token = await fbUser.getIdToken();
  const res = await fetch(`${API_PREFIX}/users/${fbUid}/profile`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ...formData,
      iidxId: formData.iidxId.replace(/-/g, ""),
      profileText: formData.bio || null,
      isPublic: formData.isPublic ? 1 : 0,
      arenaPrivacy,
    }),
  });

  if (!res.ok) throw new Error();
}
