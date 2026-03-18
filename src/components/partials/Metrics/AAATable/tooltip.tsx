"use client";

import { AAATableItem } from "@/hooks/metrics/useAAATable";
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
  }) => (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "text-[10px] font-black uppercase tracking-wider",
            colorClass,
          )}
        >
          TARGET: {label}
        </span>
        <Badge
          className={cn(
            "h-4 px-1 text-[10px] font-bold border-none",
            data.diff >= 0 ? "bg-blue-600 text-white" : "bg-red-600 text-white",
          )}
        >
          {data.diff >= 0 ? `+${data.diff}` : data.diff}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col">
          <span className="text-[9px] font-bold text-slate-500 uppercase">
            Score
          </span>
          <span className="font-mono text-xs font-bold text-white">
            {data.exScore}
          </span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[9px] font-bold text-slate-500 uppercase">
            Target BPI
          </span>
          <span className="font-mono text-xs font-bold text-white">
            {data.targetBpi.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-w-[240px] flex-col gap-3 p-1 text-white">
      <div>
        <h4 className="text-sm font-black leading-tight tracking-tight">
          {item.title}{" "}
          <span className="text-slate-500 font-mono">[{diffChar}]</span>
        </h4>
        <Badge
          variant="outline"
          className="mt-1.5 h-4 border-white/20 text-[9px] font-bold text-slate-400"
        >
          Notes: {item.notes}
        </Badge>
      </div>

      <Separator className="bg-white/10" />

      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-black tracking-widest text-blue-400 uppercase">
          Your Status
        </span>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-500 uppercase">
              Score
            </span>
            <span className="font-mono text-xs font-black text-white">
              {item.user.exScore}
            </span>
          </div>
          <div className="flex flex-col border-x border-bpim-border">
            <span className="text-[9px] font-bold text-slate-500 uppercase">
              Rate
            </span>
            <span className="font-mono text-xs font-black text-white">
              {scoreRate}%
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-500 uppercase">
              BPI
            </span>
            <span className="font-mono text-xs font-black text-blue-300">
              {item.user.bpi.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <Separator className="bg-white/10" />

      <div className="flex flex-col gap-4">
        <TargetSection
          label="AAA"
          data={item.targets.aaa}
          colorClass="text-yellow-400"
        />
        <TargetSection
          label="MAX-"
          data={item.targets.maxMinus}
          colorClass="text-orange-400"
        />
      </div>
    </div>
  );
};
