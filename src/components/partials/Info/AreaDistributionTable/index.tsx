import { useState } from "react";
import { DashCard } from "@/components/ui/dashcard";
import { Button } from "@/components/ui/button";
import type { AreaEntry } from "@/types/siteStats";

const PAGE_SIZE = 10;

export function AreaDistributionTable({ data }: { data: AreaEntry[] }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const visible = data.slice(0, visibleCount);
  const hasMore = visibleCount < data.length;
  const max = data[0]?.count ?? 1;

  return (
    <DashCard>
      <h3 className="mb-3 text-sm font-bold uppercase text-bpim-muted">
        県別利用者数
      </h3>

      <div className="flex flex-col gap-1.5">
        {visible.map((entry, i) => (
          <div key={entry.area} className="flex items-center gap-3">
            <span className="w-5 shrink-0 text-right font-mono text-[10px] text-bpim-muted">
              {i + 1}
            </span>
            <span className="w-24 shrink-0 truncate text-xs text-bpim-text">
              {entry.area}
            </span>
            <div className="flex flex-1 items-center gap-2">
              <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-bpim-surface-2">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-bpim-primary"
                  style={{ width: `${(entry.count / max) * 100}%` }}
                />
              </div>
              <span className="w-10 shrink-0 text-right font-mono text-xs font-bold text-bpim-text">
                {entry.count.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 w-full text-xs text-bpim-muted hover:text-bpim-text"
          onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
        >
          さらに表示 ({data.length - visibleCount} 件)
        </Button>
      )}
    </DashCard>
  );
}
