import { Badge } from "@/components/ui/badge";

export const BpiHistoryTable = ({ history }: { history: any[] }) => (
  <div className="flex flex-col gap-1 w-full">
    <div className="grid grid-cols-[1fr_2fr_2fr] gap-3 px-4 py-1">
      <span className="text-[9px] font-bold tracking-widest text-slate-500 uppercase">
        Ver
      </span>
      <span className="text-center text-[9px] font-bold tracking-widest text-slate-500 uppercase">
        Arena
      </span>
      <span className="text-right text-[9px] font-bold tracking-widest text-slate-500 uppercase">
        Total BPI
      </span>
    </div>

    <div className="flex flex-col gap-1.5">
      {history.map((hist) => (
        <div
          key={hist.version}
          className="grid grid-cols-[1fr_2fr_2fr] items-center gap-3 rounded-lg border border-bpim-border bg-white/5 p-2 px-4 transition-colors hover:bg-white/10"
        >
          <span className="font-mono text-xs font-bold text-slate-400">
            {hist.version}
          </span>
          <div className="flex justify-center">
            {hist.arenaRank !== "N/A" ? (
              <Badge
                variant="outline"
                className="h-4 border-slate-700 bg-slate-800 px-1.5 text-[9px] font-bold text-slate-300"
              >
                {hist.arenaRank}
              </Badge>
            ) : (
              <span className="text-slate-700 text-xs">-</span>
            )}
          </div>
          <span className="text-right font-mono text-xs font-black text-blue-300">
            {hist.totalBpi?.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  </div>
);
