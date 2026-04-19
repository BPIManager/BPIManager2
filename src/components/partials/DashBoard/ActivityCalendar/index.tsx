import { useActivity } from "@/hooks/stats/useActivity";
import { ActivityCalendar } from "./ui";
import { ActivityCalendarSkeleton } from "./skeleton";
import { useStatsFilter } from "@/contexts/stats/FilterContext";
import { Dispatch, SetStateAction, useEffect } from "react";

export const ActivitySection = ({
  userId,
  setNodata,
}: {
  userId?: string;
  setNodata: Dispatch<SetStateAction<boolean>>;
}) => {
  const { levels, diffs, version } = useStatsFilter();
  const { activity, isLoading } = useActivity(userId, levels, diffs, version);

  useEffect(() => {
    if (!isLoading && (!activity || activity.length === 0)) {
      setNodata(true);
    } else {
      setNodata(false);
    }
  }, [isLoading, activity]);

  if (isLoading) return <ActivityCalendarSkeleton />;

  return activity ? (
    <ActivityCalendar
      data={activity}
      userId={userId as string}
      version={version}
    />
  ) : null;
};
