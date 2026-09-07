import { User as FirebaseUser } from "firebase/auth";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { authFetch } from "@/utils/common/fetch";
import { fetcherV2, unwrapApiResponse } from "@/services/swr/fetchV2";

export interface ArenaPrivacySettings {
  showArenaClass: boolean;
  showArenaRank: boolean;
  showArea: boolean;
  showGrade: boolean;
}

export async function fetchStatsPrivacy(
  fbUid: string,
  fbUser: FirebaseUser,
): Promise<{ statsPrivacy?: ArenaPrivacySettings }> {
  return fetcherV2([`${API_V2_PREFIX}/users/${fbUid}/profile`, fbUser]);
}

export async function checkUserNameAvailability(
  userName: string,
  fbUser: FirebaseUser | null | undefined,
  signal: AbortSignal,
): Promise<{ available: boolean; message?: string }> {
  const token = await fbUser?.getIdToken();
  const res = await fetch(
    `${API_V2_PREFIX}/usernames/${encodeURIComponent(userName)}/availability`,
    {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    },
  );
  return unwrapApiResponse<{ available: boolean; message?: string }>(res);
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
  const res = await authFetch(
    `${API_V2_PREFIX}/users/${fbUid}/profile`,
    method,
    fbUser,
    {
      ...formData,
      iidxId: formData.iidxId.replace(/-/g, ""),
      profileText: formData.bio || null,
      isPublic: formData.isPublic ? 1 : 0,
      arenaPrivacy,
    },
  );

  if (!res.ok) throw new Error();
}
