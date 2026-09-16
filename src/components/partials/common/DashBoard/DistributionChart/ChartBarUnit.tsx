import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

function tooltipHeader(
  label: string,
  step?: number,
  unit?: "bpi" | "scoreRate",
): string {
  if (step === undefined) return label;
  if (unit === "scoreRate") {
    if (label === "100") return "100%";
    const from = parseInt(label, 10);
    if (isNaN(from)) return label;
    const to = from + step;
    return `${from}% 〜 ${to >= 100 ? "100" : to}%`;
  }
  if (label === "<-10") return "BPI < -10";
  if (label === "100+") return "BPI 100+";
  const from = parseInt(label, 10);
  if (isNaN(from)) return label;
  const to = from + step;
  return `BPI ${from} 〜 ${to >= 100 ? "100+" : to}`;
}

const ChartBarUnit = ({
  label,
  myCount,
  rivalCount,
  maxCount,
  color,
  index,
  totalCount,
  primaryColor,
  warningColor,
  showLabel,
  showCount,
  step,
  unit,
  myName,
  rivalName,
  dense = false,
  maxRef,
}: {
  label: string;
  myCount: number;
  rivalCount?: number;
  maxCount: number;
  color: string;
  index: number;
  totalCount: number;
  primaryColor: string;
  warningColor: string;
  showLabel: boolean;
  showCount: boolean;
  step?: number;
  unit?: "bpi" | "scoreRate";
  myName: string;
  rivalName: string;
  dense?: boolean;
  maxRef?: React.RefObject<HTMLDivElement | null>;
}) => {
  const [open, setOpen] = useState(false);
  const hasRival = rivalCount !== undefined;
  const myHeight = `${(myCount / maxCount) * 100}%`;
  const rivalHeight = hasRival ? `${(rivalCount! / maxCount) * 100}%` : "0%";
  const animDelay = `${Math.min((index / totalCount) * 0.5, 0.5)}s`;

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <div
          ref={maxRef}
          className={cn(
            "flex h-45 cursor-default flex-col items-stretch gap-0",
            dense ? "min-w-1 flex-1" : "min-w-0 max-w-15 flex-1",
          )}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onTouchStart={(e) => {
            e.preventDefault();
            setOpen((o) => !o);
          }}
        >
          <div className="relative h-37.5 w-full">
            <div
              className={cn(
                "absolute bottom-6.25 left-0 right-0 flex h-25 items-end justify-center",
                hasRival ? "gap-0.5" : "gap-0",
              )}
            >
              <div className="relative flex h-full flex-1 min-w-0 flex-col justify-end">
                {showCount && (
                  <span
                    className={cn(
                      "whitespace-nowrap text-[10px] font-bold text-bpim-primary",
                      myCount > 0 ? "visible" : "hidden",
                      hasRival
                        ? "absolute bottom-[calc(100%+2px)] left-1/2 -translate-x-1/2"
                        : "relative mb-0.5 w-full text-center",
                    )}
                  >
                    {myCount}
                  </span>
                )}
                <div
                  data-capture-no-anim=""
                  className="w-full origin-bottom rounded-t-xs opacity-90 animate-[bounceGrow_0.6s_ease-out_both]"
                  style={{
                    height: myHeight,
                    backgroundColor: color,
                    borderTop: `2px solid ${primaryColor}`,
                    animationDelay: animDelay,
                  }}
                />
              </div>

              {hasRival && (
                <div className="relative flex h-full flex-1 min-w-0 flex-col justify-end">
                  <div
                    data-capture-no-anim=""
                    className="w-full origin-bottom rounded-t-xs opacity-45 animate-[bounceGrow_0.6s_ease-out_both]"
                    style={{
                      height: rivalHeight,
                      backgroundColor: color,
                      borderTop: `2px solid ${warningColor}`,
                      animationDelay: animDelay,
                    }}
                  />
                </div>
              )}
            </div>

            {hasRival && showCount && (
              <span
                className={cn(
                  "absolute bottom-1.25 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-bpim-warning",
                  rivalCount! > 0 ? "visible" : "hidden",
                )}
              >
                {rivalCount}
              </span>
            )}
          </div>

          <div className="h-px w-full bg-bpim-overlay/60" />
          <div className="flex h-7.5 justify-center">
            {showLabel && (
              <span className="mt-2 whitespace-nowrap text-[10px] font-bold text-bpim-muted">
                {label}
              </span>
            )}
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="flex flex-col gap-0.5">
        <span className="font-bold">{tooltipHeader(label, step, unit)}</span>
        <span style={{ color: primaryColor }}>
          {myName}: {myCount}
        </span>
        {hasRival && (
          <span style={{ color: warningColor }}>
            {rivalName}: {rivalCount}
          </span>
        )}
      </TooltipContent>
    </Tooltip>
  );
};

export default ChartBarUnit;
