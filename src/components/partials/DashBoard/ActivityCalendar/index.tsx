import { useActivity } from "@/hooks/stats/useActivity";
import { ActivityCalendar } from "./ui";
import { ActivityCalendarSkeleton } from "./skeleton";
import { useStatsFilter } from "@/contexts/stats/FilterContext";
import { NoDataAlert } from "../NoData";

export const ActivitySection = ({ userId }: { userId?: string }) => {
  const { levels, diffs, version } = useStatsFilter();
  const { activity, isLoading } = useActivity(userId, levels, diffs, version);
  if (isLoading) return <ActivityCalendarSkeleton />;

  if (!activity || activity.length === 0) {
    return <NoDataAlert />;
  }
  return activity ? (
    <ActivityCalendar
      data={activity}
      userId={userId as string}
      version={version}
    />
  ) : null;
};
