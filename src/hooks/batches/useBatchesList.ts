import { useUser } from "@/contexts/users/UserContext";
import { fetcher } from "@/utils/common/fetch";
import useSWR from "swr";

export interface TopScore {
  title: string;
  bpi: number;
  clearState: string;
}

export interface UpdateLog {
  id: number;
  batchId: string;
  version: number;
  totalBpi: number;
  songCount: number;
  diff: number;
  createdAt: string;
  topScores: TopScore[];
}

export const useBatchesList = (userId: string | undefined, version: string) => {
  const { fbUser } = useUser();
  const { data, error, isLoading } = useSWR<UpdateLog[]>(
    userId ? [`/api/${userId}/batches?version=${version}`, fbUser] : null,
    fetcher,
  );
  return {
    logs: data || [],
    isLoading,
    isError: error,
  };
};
