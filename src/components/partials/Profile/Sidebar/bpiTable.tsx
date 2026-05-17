import { StatEntry } from "@/types/users/profile";
import { ArenaClassBadge } from "./ArenaClassBadge";

export const BpiHistoryTable = ({ stats }: { stats: StatEntry[] }) => (
  <div className="flex flex-col gap-1 w-full">
    <div className="grid grid-cols-[1fr_2fr_2fr] gap-3 px-4 py-1">
      <span className="text-[9px] font-bold tracking-widest text-bpim-muted uppercase">
        Ver
      </span>
      <span className="text-center text-[9px] font-bold tracking-widest text-bpim-muted uppercase">
        Arena
      </span>
      <span className="text-right text-[9px] font-bold tracking-widest text-bpim-muted uppercase">
        Total BPI
      </span>
    </div>

    <div className="flex flex-col gap-1.5">
      {stats.map((stat) => (
        <div
          key={stat.version}
          className="grid grid-cols-[1fr_2fr_2fr] items-center gap-3 rounded-lg border border-bpim-border bg-bpim-surface-2/60 p-2 px-4 transition-colors hover:bg-bpim-overlay"
        >
          <span className="font-mono text-xs font-bold text-bpim-muted">
            {stat.version}
          </span>
          <div className="flex justify-center">
            <ArenaClassBadge arenaClass={stat.arenaClass} size="sm" />
          </div>
          <span className="text-right font-mono text-xs font-black text-bpim-primary">
            {stat.totalBpi != null ? stat.totalBpi.toFixed(2) : "-"}
          </span>
        </div>
      ))}
    </div>
  </div>
);
