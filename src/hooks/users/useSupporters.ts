import useSWR from "swr";
import { fetcherV2 } from "@/services/swr/fetchV2";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import type { UserRoleInfo } from "@/types/users/profile";

export interface SupporterUser {
  userId: string;
  userName: string;
  iidxId: string;
  profileImage: string | null;
  totalBpi: number | null;
  role: UserRoleInfo;
}

interface SupportersResponse {
  supporters: SupporterUser[];
}

export const useSupporters = () => {
  const { data, error, isLoading } = useSWR<SupportersResponse>(
    `${API_V2_PREFIX}/supporters`,
    fetcherV2,
    { revalidateOnFocus: false },
  );

  return { data, isLoading, isError: error };
};
