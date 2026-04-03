"use client";

import { useState, useMemo, useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import dayjs from "@/lib/dayjs";

const WEEKDAYS = ["月", "火", "水", "木", "金", "土", "日"];

interface CalendarPickerProps {
  activeDates: Set<string>;
  selectedDate: string | null;
  onSelect: (date: string) => void;
  initialMonth?: { year: number; month: number };
}

export const CalendarPicker = ({
  activeDates,
  selectedDate,
  onSelect,
  initialMonth,
}: CalendarPickerProps) => {
  const today = dayjs();
  const todayStr = today.format("YYYY-MM-DD");

  const [view, setView] = useState(() => {
    if (initialMonth) {
      return dayjs()
        .year(initialMonth.year)
        .month(initialMonth.month)
        .startOf("month");
    }
    return today.startOf("month");
  });

  useEffect(() => {
    if (initialMonth) {
      setView(
        dayjs()
          .year(initialMonth.year)
          .month(initialMonth.month)
          .startOf("month"),
      );
    }
  }, [initialMonth]);

  const prevMonth = () => setView((v) => v.subtract(1, "month"));
  const nextMonth = () => setView((v) => v.add(1, "month"));

  const cells = useMemo(() => {
    const startOfMonth = view.startOf("month");
    const daysInMonth = view.daysInMonth();
    const startPad = (startOfMonth.day() + 6) % 7;

    const result: (string | null)[] = Array(startPad).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      result.push(startOfMonth.date(d).format("YYYY-MM-DD"));
    }
    return result;
  }, [view]);

  return (
    <div className="select-none p-2">
      <div className="mb-3 flex items-center justify-between gap-2">
        <Button variant="ghost" size="icon-sm" onClick={prevMonth}>
          <ChevronLeftIcon className="size-4" />
        </Button>
        <span className="text-xs font-semibold text-bpim-text">
          {view.format("YYYY年M月")}
        </span>
        <Button variant="ghost" size="icon-sm" onClick={nextMonth}>
          <ChevronRightIcon className="size-4" />
        </Button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-0.5">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="flex h-6 items-center justify-center text-[10px] font-medium text-bpim-muted"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((dateStr, i) => {
          if (!dateStr) return <div key={i} />;

          const cellDate = dayjs(dateStr);
          const isToday = dateStr === todayStr;
          const isActive = activeDates.has(dateStr) && !isToday;
          const isSelected = dateStr === selectedDate;

          return (
            <button
              key={dateStr}
              disabled={!isActive}
              onClick={() => onSelect(dateStr)}
              className={cn(
                "relative flex h-7 w-full items-center justify-center rounded text-xs transition-colors",
                isActive
                  ? "cursor-pointer text-bpim-text hover:bg-bpim-overlay"
                  : "cursor-default text-bpim-muted/25",
                isSelected &&
                  "bg-bpim-primary! text-white! hover:bg-bpim-primary/90!",
                isToday &&
                  "ring-1 ring-bpim-primary/50 text-bpim-primary font-bold",
              )}
            >
              {cellDate.date()}
              {isToday && (
                <span className="absolute bottom-0.5 left-1/2 h-0.5 w-0.5 -translate-x-1/2 rounded-full bg-bpim-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
