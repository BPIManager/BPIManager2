import RivalSummaryCard from "./ui";
import RivalSummarySkeleton from "./skeleton";
import RivalWinLossSummaryNotFound from "@/components/partials/common/ErrorStates/RivalWinLossSummaryNotFound";
import FetchErrorState, { type FetchError } from "@/components/partials/common/ErrorStates/FetchErrorState";
import { RivalSummaryResult } from "@/types/social/rival";

interface RivalListProps {
  results: RivalSummaryResult[];
  isLoading: boolean;
  error: FetchError;
  onCardClick: (userId: string) => void;
}

const RivalList = ({
  results,
  isLoading,
  error,
  onCardClick,
}: RivalListProps) => {
  if (error) {
    return <FetchErrorState error={error} />;
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

export default RivalList;
