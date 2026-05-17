import { DashCard } from "@/components/ui/dashcard";
import { useOfficialArena } from "@/hooks/siteStats/useOfficialArena";
import { getArenaClassColor } from "@/utils/arenaClass";
import type { ArenaRankEntry } from "@/types/siteStats";
import { AlertCircleIcon } from "lucide-react";

export function ArenaRankComparison({
  selfReported,
}: {
  selfReported: ArenaRankEntry[];
}) {
  const { data: official, isLoading, isError } = useOfficialArena();

  const officialMap = new Map(
    (official?.distribution ?? []).map((e) => [e.rank, e.count]),
  );

  const maxOfficial = Math.max(
    ...(official?.distribution ?? []).map((e) => e.count),
    1,
  );

  return (
    <DashCard>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase text-bpim-muted">
          アリーナランク別登録者数
        </h3>
      </div>

      {isError ? (
        <p className="text-xs text-bpim-muted">
          公式データが未生成です。生成されるまでしばらくお待ちください。
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {/* header */}
          <div className="grid grid-cols-[48px_1fr_52px_52px_52px] gap-x-3 px-1">
            <span className="text-[8px] font-bold uppercase text-bpim-muted">
              ランク
            </span>
            <span className="text-[9px] font-bold uppercase text-bpim-muted" />
            <span className="text-right text-[8px] font-bold uppercase text-bpim-muted">
              BPIM2
            </span>
            <span className="text-right text-[8px] font-bold uppercase text-bpim-muted">
              全プレイヤー
            </span>
            <span className="text-right text-[8px] font-bold uppercase text-bpim-muted">
              カバー率
            </span>
          </div>
          {selfReported.map((entry) => {
            const bpim2 = entry.count;
            const off = officialMap.get(entry.rank) ?? 0;
            const coverage = off > 0 ? (bpim2 / off) * 100 : null;
            const color = getArenaClassColor(entry.rank);
            const bpim2Pct =
              off > 0 ? (bpim2 / maxOfficial) * 100 : bpim2 > 0 ? 100 : 0;
            const offPct = (off / maxOfficial) * 100;

            return (
              <div
                key={entry.rank}
                className="grid grid-cols-[48px_1fr_52px_52px_52px] items-center gap-x-3"
              >
                <span
                  className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-black"
                  style={{
                    backgroundColor: color.bg,
                    color: color.text,
                    border: `1px solid ${color.border}`,
                  }}
                >
                  {entry.rank}
                </span>

                <div className="relative h-4 overflow-hidden rounded-sm bg-bpim-surface-2">
                  {!isLoading && off > 0 && (
                    <div
                      className="absolute inset-y-0 left-0 rounded-sm bg-bpim-muted/30"
                      style={{ width: `${offPct}%` }}
                    />
                  )}
                  {bpim2 > 0 && (
                    <div
                      className="absolute inset-y-0 left-0 rounded-sm transition-all duration-300"
                      style={{
                        width: `${bpim2Pct}%`,
                        backgroundColor: color.text + "99",
                      }}
                    />
                  )}
                </div>

                <span className="text-right font-mono text-xs font-bold text-bpim-text">
                  {bpim2.toLocaleString()}
                </span>
                <span className="text-right font-mono text-xs font-bold text-bpim-text">
                  {off.toLocaleString()}
                </span>
                <span className="text-right font-mono text-xs font-bold text-bpim-muted">
                  {isLoading
                    ? "..."
                    : coverage != null
                      ? `${coverage.toFixed(1)}%`
                      : "-"}
                </span>
              </div>
            );
          })}
        </div>
      )}
      <div className="flex items-center gap-2 rounded-lg border border-bpim-border bg-bpim-surface px-3 py-2 text-xs text-bpim-muted mt-2">
        <AlertCircleIcon size={12} className="shrink-0" />
        <span>
          eAMUSEMENTサイトの制約により上位6,000名のデータのみ取得できるため、B1以降の実人数データは不正確です。
        </span>
      </div>
    </DashCard>
  );
}
