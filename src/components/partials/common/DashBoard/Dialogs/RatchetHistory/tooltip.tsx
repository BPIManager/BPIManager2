

import { Rectangle } from "recharts";

import { cn } from "@/lib/utils";

import { SKILL_COLOR, ChartPoint } from "@/components/partials/common/DashBoard/Dialogs/RatchetHistory/types";

export interface TooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload: ChartPoint }>;
  label?: string | number;
  rawLabel: string;
  ratchetedLabel: string;
  rawDeltaLabel: string;
  skillLabel: string;
}

export const RatchetTooltip = ({
  active,
  payload,
  label,
  rawLabel,
  ratchetedLabel,
  rawDeltaLabel,
  skillLabel,
}: TooltipProps) => {
  if (!active || !payload?.length) return null;
  const { raw, ratcheted, rawDelta, skill } = payload[0].payload;
  const gap = raw - ratcheted;

  return (
    <div className="min-w-45 rounded-md border border-bpim-border bg-bpim-surface p-3 shadow-xl">
      <p className="mb-2 text-[10px] font-bold text-bpim-muted">{label}</p>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs font-bold text-bpim-warning">
            {rawLabel}
          </span>
          <span className="font-mono text-sm font-bold text-bpim-warning">
            {raw.toFixed(2)}
          </span>
        </div>
        {rawDelta !== 0 && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] text-bpim-muted">{rawDeltaLabel}</span>
            <span
              className={cn(
                "font-mono text-xs font-bold",
                rawDelta > 0 ? "text-bpim-success" : "text-bpim-danger",
              )}
            >
              {rawDelta > 0 ? "+" : ""}
              {rawDelta.toFixed(2)}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs font-bold text-bpim-primary">
            {ratchetedLabel}
          </span>
          <span className="font-mono text-sm font-bold text-bpim-primary">
            {ratcheted.toFixed(2)}
          </span>
        </div>
        {gap < 0 && (
          <>
            <div className="my-1 h-px w-full bg-bpim-overlay/60" />
            <div className="flex items-center justify-between gap-4">
              <span className="text-[10px] text-bpim-muted">gap</span>
              <span className="font-mono text-xs font-bold text-bpim-danger">
                {gap.toFixed(2)}
              </span>
            </div>
          </>
        )}
        {skill != null && (
          <>
            <div className="my-1 h-px w-full bg-bpim-overlay/60" />
            <div className="flex items-center justify-between gap-4">
              <span
                className="text-xs font-bold"
                style={{ color: SKILL_COLOR }}
              >
                {skillLabel}
              </span>
              <span
                className="font-mono text-sm font-bold"
                style={{ color: SKILL_COLOR }}
              >
                {skill.toFixed(3)}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export interface RawDeltaBarProps {
  payload?: ChartPoint;
  successColor: string;
  dangerColor: string;
  [key: string]: unknown;
}

export const RawDeltaBar = (props: RawDeltaBarProps) => {
  const { payload, successColor, dangerColor } = props;
  if (!payload || payload.rawDelta === 0) return null;
  const fill = payload.rawDelta > 0 ? successColor : dangerColor;
  return (
    <Rectangle {...props} fill={fill} opacity={0.6} radius={[1, 1, 1, 1]} />
  );
};
