"use client";

import { AAATableItem } from "@/types/metrics/aaa";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface Props {
  item: AAATableItem;
}

export const AAATableTooltip = ({ item }: Props) => {
  const diffChar = item.difficulty.slice(0, 1).toUpperCase();
  const maxScore = item.notes * 2;
  const scoreRate = ((item.user.exScore / maxScore) * 100).toFixed(2);

  const TargetSection = ({
    label,
    data,
    colorClass,
  }: {
    label: string;
    data: { exScore: number; targetBpi: number; diff: number };
    colorClass: string;
  }) => {
    const targetRate = ((data.exScore / maxScore) * 100).toFixed(1);
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "text-[10px] font-black uppercase tracking-wider",
              colorClass,
            )}
          >
            {label}
          </span>
          <Badge
            className={cn(
              "h-4 px-1 text-[10px] font-bold border-none",
              data.diff >= 0
                ? "bg-bpim-primary text-bpim-text"
                : "bg-bpim-danger text-bpim-text",
            )}
          >
            {data.diff >= 0 ? `+${data.diff}` : data.diff}
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-1 text-center">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-bpim-muted uppercase">
              BPI
            </span>
            <span className="font-mono text-xs font-bold text-bpim-text">
              {data.targetBpi.toFixed(2)}
            </span>
          </div>
          <div className="flex flex-col border-x border-bpim-border">
            <span className="text-[9px] font-bold text-bpim-muted uppercase">
              %
            </span>
            <span className="font-mono text-xs font-bold text-bpim-text">
              {targetRate}%
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-bpim-muted uppercase">
              EX
            </span>
            <span className="font-mono text-xs font-bold text-bpim-text">
              {data.exScore}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-w-60 flex-col gap-3 p-1 text-bpim-text">
      <div>
        <h4 className="text-sm font-black leading-tight tracking-tight">
          {item.title}{" "}
          <span className="text-bpim-muted font-mono">[{diffChar}]</span>
        </h4>
      </div>

      <Separator className="bg-bpim-overlay/60" />

      <div className="flex flex-col gap-3">
        {item.targets.custom && (
          <>
            <TargetSection
              label="カスタム"
              data={item.targets.custom}
              colorClass="text-bpim-primary"
            />
          </>
        )}
        <TargetSection
          label="AAA"
          data={item.targets.aaa}
          colorClass="text-yellow-400"
        />
        <TargetSection
          label="MAX-"
          data={item.targets.maxMinus}
          colorClass="text-bpim-warning"
        />
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-black tracking-widest text-bpim-primary uppercase">
            あなた
          </span>
          <div className="grid grid-cols-3 gap-1 text-center">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-bpim-muted uppercase">
                BPI
              </span>
              <span className="font-mono text-xs font-black text-bpim-primary">
                {item.user.bpi.toFixed(2)}
              </span>
            </div>
            <div className="flex flex-col border-x border-bpim-border">
              <span className="text-[9px] font-bold text-bpim-muted uppercase">
                %
              </span>
              <span className="font-mono text-xs font-black text-bpim-text">
                {scoreRate}%
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-bpim-muted uppercase">
                EX
              </span>
              <span className="font-mono text-xs font-black text-bpim-text">
                {item.user.exScore > 0 ? item.user.exScore : "-"}
              </span>
            </div>
          </div>
        </div>

        <Separator className="bg-bpim-overlay/60" />
      </div>
    </div>
  );
};
