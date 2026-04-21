"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "@/lib/dayjs";
import NextLink from "next/link";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DashCard } from "@/components/ui/dashcard";

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

export const ActivityCalendar = ({ data, userId, version }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const isTouchDevice =
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: coarse)").matches;

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
      <p className="mb-4 text-sm font-bold text-bpim-muted">最近の更新</p>

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
            {calendarDays.map((day) => {
              const isOpen = hoveredDate === day.date;
              return (
                <Popover
                  key={day.date}
                  open={isOpen}
                  onOpenChange={(open) => {
                    if (!open) setHoveredDate(null);
                  }}
                >
                  <PopoverTrigger asChild>
                    <div
                      className={cn(
                        "h-2.75 w-2.75 rounded-xs transition-all duration-200",
                        !day.isFuture &&
                          "cursor-pointer hover:scale-125 hover:brightness-125",
                        day.isFuture && "cursor-default",
                      )}
                      style={{
                        backgroundColor: getActivityColor(
                          day.count,
                          day.isFuture,
                        ),
                      }}
                      onMouseEnter={() => {
                        if (!isTouchDevice && !day.isFuture)
                          setHoveredDate(day.date);
                      }}
                      onMouseLeave={() => {
                        if (!isTouchDevice) setHoveredDate(null);
                      }}
                      onClick={(e) => {
                        if (day.isFuture) return;
                        e.stopPropagation();
                        setHoveredDate(isOpen ? null : day.date);
                      }}
                    />
                  </PopoverTrigger>
                  <PopoverContent
                    side="top"
                    className="w-auto border-bpim-border bg-bpim-surface-2 p-2"
                    onMouseEnter={() => setHoveredDate(day.date)}
                    onMouseLeave={() => setHoveredDate(null)}
                  >
                    <div className="flex flex-col gap-2">
                      <p className="whitespace-nowrap text-xs font-bold text-bpim-text">
                        {day.date}: {day.count} 件
                      </p>
                      <Button
                        asChild
                        size="sm"
                        variant="secondary"
                        className="h-6 text-[10px]"
                      >
                        <NextLink
                          href={`/users/${userId}/logs/${version}/summary/${day.date}?groupedBy=lastPlayed`}
                        >
                          サマリを表示
                        </NextLink>
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              );
            })}
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
