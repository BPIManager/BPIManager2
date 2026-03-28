import { RivalSummaryCard } from "./ui";
import { RivalSummarySkeleton } from "./skeleton";
import { RivalWinLossSummaryNotFound } from "../../DashBoard/Rivals/nodata";
import { RivalSummaryResult } from "@/types/social/rival";

interface RivalListProps {
  results: RivalSummaryResult[];
  isLoading: boolean;
  isError: boolean;
  onCardClick: (userId: string) => void;
}

export const RivalList = ({
  results,
  isLoading,
  isError,
  onCardClick,
}: RivalListProps) => {
  if (isError) {
    return (
      <div className="flex h-64 items-center justify-center text-bpim-danger font-bold">
        データの取得に失敗しました。
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <RivalSummarySkeleton key={i} />
        ))}
      </div>
    );
  }

  if (results.length === 0) return <RivalWinLossSummaryNotFound />;

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {results.map((rival) => (
        <RivalSummaryCard
          key={rival.userId}
          rival={rival}
          onClick={() => onCardClick(rival.userId)}
        />
      ))}
    </div>
  );
};
