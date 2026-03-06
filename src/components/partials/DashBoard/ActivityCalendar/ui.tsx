import { useActivity } from "@/hooks/stats/useActivity";
import { ActivityCalendar } from ".";
import { ActivityCalendarSkeleton } from "./skeleton";
import { useStatsFilter } from "@/contexts/stats/FilterContext";

export const ActivitySection = ({ userId }: { userId?: string }) => {
  const { levels, diffs } = useStatsFilter();
  const { activity, isLoading } = useActivity(userId, levels, diffs);
  if (isLoading) return <ActivityCalendarSkeleton />;
  return activity ? <ActivityCalendar data={activity} /> : null;
};
