"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "@/lib/dayjs";
import NextLink from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DashCard } from "@/components/ui/dashcard";
import { useTranslation } from "@/hooks/common/useTranslation";

interface ActivityData {
  date: string;
  count: number;
}

interface Props {
  data: ActivityData[];
  userId: string;
  version: string;
}

const ACTIVITY_VARS = [
  "var(--activity-0)",
  "var(--activity-1)",
  "var(--activity-2)",
  "var(--activity-3)",
  "var(--activity-4)",
] as const;

const getActivityColor = (count: number, isFuture: boolean): string => {
  if (isFuture) return "transparent";
  if (count === 0) return ACTIVITY_VARS[0];
  if (count <= 5) return ACTIVITY_VARS[1];
  if (count <= 15) return ACTIVITY_VARS[2];
  if (count <= 30) return ACTIVITY_VARS[3];
  return ACTIVITY_VARS[4];
};

interface ActivityCellProps {
  day: { date: string; count: number; isFuture: boolean };
  userId: string;
  version: string;
}

/**
 * 1日分のセル。ツールチップ内のボタンを押せるよう、Radix Tooltip の「内容へポインタを移せる」
 * 挙動に任せ、ホバー外れでの手動クローズはしない（分布カードのツールチップと同じ方式）。
 */
const ActivityCell = ({ day, userId, version }: ActivityCellProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "h-2.75 w-2.75 rounded-xs transition-all duration-200",
            !day.isFuture && "cursor-pointer hover:scale-125 hover:brightness-125",
            day.isFuture && "cursor-default",
          )}
          style={{
            backgroundColor: getActivityColor(day.count, day.isFuture),
          }}
          onMouseEnter={() => {
            if (!day.isFuture) setOpen(true);
          }}
          onClick={() => {
            if (!day.isFuture) setOpen(true);
          }}
          onTouchStart={(e) => {
            if (day.isFuture) return;
            e.preventDefault();
            setOpen((o) => !o);
          }}
        />
      </TooltipTrigger>
      {!day.isFuture && (
        <TooltipContent side="top" className="flex flex-col items-stretch gap-2 p-2">
          <p className="whitespace-nowrap text-xs font-bold text-bpim-text">
            {day.date}: {day.count}
            {t("dashboard.activity.countUnit")}
          </p>
          <Button asChild size="sm" variant="secondary" className="h-6 text-[10px]">
            <NextLink
              href={`/users/${userId}/logs/${version}/summary/${day.date}?groupedBy=lastPlayed`}
            >
              {t("dashboard.activity.viewSummary")}
            </NextLink>
          </Button>
        </TooltipContent>
      )}
    </Tooltip>
  );
};

const ActivityCalendar = ({ data, userId, version }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const lastMonthStr = dayjs().tz().subtract(1, "month").format("YYYY-MM");

  const calendarDays = useMemo(() => {
    const days = [];
    const today = dayjs().tz().startOf("day");
    const endOfCalendar = dayjs().tz().endOf("week");
    const dataMap = new Map(
      data.map((d) => [dayjs(d.date).tz().format("YYYY-MM-DD"), d.count]),
    );
    for (let i = 370; i >= 0; i--) {
      const dateObj = endOfCalendar.subtract(i, "day");
      const dateStr = dateObj.format("YYYY-MM-DD");
      const isFuture = dateObj.isAfter(today, "day");
      days.push({ date: dateStr, count: dataMap.get(dateStr) ?? 0, isFuture });
    }
    return days;
  }, [data]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [calendarDays]);

  return (
    <DashCard>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-bold text-bpim-muted">
          {t("dashboard.activity.title")}
        </p>
        <Button
          asChild
          size="sm"
          variant="outline"
          className="bg-bpim-bg h-6 text-[10px] px-2"
        >
          <NextLink
            href={`/users/${userId}/monthly-review/${lastMonthStr}?version=${version}`}
          >
            {t("monthlyReview.activityCalendar.button")}
          </NextLink>
        </Button>
      </div>

      <div
        ref={scrollRef}
        className="overflow-x-auto pb-2 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-bpim-overlay"
      >
        <div className="flex items-start gap-3" style={{ minWidth: "720px" }}>
          <div
            className="grid text-[10px] text-bpim-subtle"
            style={{
              gridTemplateRows: "repeat(7, 11px)",
              gap: "3px",
              marginTop: "2px",
            }}
          >
            <div className="h-2.75" />
            <div className="flex items-center h-2.75">Mon</div>
            <div className="h-2.75" />
            <div className="flex items-center h-2.75">Wed</div>
            <div className="h-2.75" />
            <div className="flex items-center h-2.75">Fri</div>
            <div className="h-2.75" />
          </div>

          <div
            className="flex-1"
            style={{
              display: "grid",
              gridTemplateRows: "repeat(7, 1fr)",
              gridTemplateColumns: "repeat(53, 1fr)",
              gridAutoFlow: "column",
              gap: "3px",
            }}
          >
            <TooltipProvider>
              {calendarDays.map((day) => (
                <ActivityCell
                  key={day.date}
                  day={day}
                  userId={userId}
                  version={version}
                />
              ))}
            </TooltipProvider>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1 text-[10px] text-bpim-muted">
        <span>Less</span>
        {[0, 5, 15, 30, 50].map((v) => (
          <div
            key={v}
            className="h-2.5 w-2.5 rounded-xs"
            style={{ backgroundColor: getActivityColor(v, false) }}
          />
        ))}
        <span>More</span>
      </div>
    </DashCard>
  );
};

export default ActivityCalendar;
