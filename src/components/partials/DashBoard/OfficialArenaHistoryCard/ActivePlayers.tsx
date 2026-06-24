import { A_RANKS } from "@/constants/iidx/arenaRanks";
import { useTranslation } from "@/hooks/common/useTranslation";
import { getArenaClassColor } from "@/utils/arenaClass";
import { HelpTooltip } from "@/components/ui/tooltip";
import type { ActiveArenaData } from "@/hooks/arena/useActiveArenaPlayers";

const COUNT_COLOR: [number, string][] = [
  [0, "text-bpim-muted"],
  [1, "text-blue-400"],
  [20, "text-yellow-400"],
  [50, "text-orange-400"],
  [100, "text-red-400"],
];

function countColor(n: number) {
  let color = COUNT_COLOR[0][1];
  for (const [t, c] of COUNT_COLOR) if (n >= t) color = c;
  return color;
}

interface ActivePlayersProps {
  data: ActiveArenaData | undefined;
  isLoading: boolean;
}

export function ActivePlayers({ data, isLoading }: ActivePlayersProps) {
  const { t } = useTranslation();

  return (
    <div className="mt-3">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold text-bpim-muted">
            {t("dashboard.arenaHistory.active.title")}
          </span>
          <HelpTooltip>
            <div className="space-y-1.5 text-[11px]">
              <p>{t("dashboard.arenaHistory.active.help.algo")}</p>
              <p>{t("dashboard.arenaHistory.active.help.undercount")}</p>
              <p>{t("dashboard.arenaHistory.active.help.wip")}</p>
            </div>
          </HelpTooltip>
        </div>
        {data?.prevFetchedAt && (
          <span className="text-[9px] text-bpim-muted opacity-60">
            {t("dashboard.arenaHistory.active.interval")}
          </span>
        )}
      </div>

      <div className="grid grid-cols-5 gap-1">
        {A_RANKS.map((cls) => {
          const count = data?.byClass[cls] ?? 0;
          const cc = countColor(isLoading || !data ? 0 : count);
          const { text, border } = getArenaClassColor(cls);
          return (
            <div
              key={cls}
              className="flex items-center gap-1 rounded border px-1.5 py-0.5"
              style={{ borderColor: border }}
            >
              <span className="text-xs font-black" style={{ color: text }}>
                {cls}
              </span>
              <span className={`ml-auto text-xs font-black tabular-nums ${cc}`}>
                {isLoading ? "…" : count}
                <span className="text-[9px] font-normal">
                  {t("dashboard.arenaHistory.active.unit")}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
