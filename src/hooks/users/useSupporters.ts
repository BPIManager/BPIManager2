import useSWR from "swr";
import { fetcher } from "@/utils/common/fetch";
import { API_PREFIX } from "@/constants/apiEndpoints";
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
    `${API_PREFIX}/supporters`,
    fetcher,
    { revalidateOnFocus: false },
  );

  return { data, isLoading, isError: error };
};
