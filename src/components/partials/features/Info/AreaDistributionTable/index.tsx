import { useState } from "react";
import { DashCard } from "@/components/ui/dashcard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { versionsNonDisabledCollection } from "@/constants/iidx/versionTitles";
import type { AreaEntry } from "@/types/siteStats";

const PAGE_SIZE = 10;

// 公式アリーナデータの取得元(eAMUSEMENT公式サイト)がまだ最新バージョンに対応して
// おらず、直近で実データが揃っているのがv33のため暫定的にデフォルト表示に固定する
// (ArenaRankComparisonと同じ方針)
const DEFAULT_VERSION = "33";

function AreaDistributionTable({
  data,
}: {
  data: Record<string, AreaEntry[]> | undefined;
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const areaByVersion = data ?? {};
  const availableVersions = versionsNonDisabledCollection.filter(
    (v) => areaByVersion[v.value]?.some((e) => e.count > 0),
  );
  const [version, setVersion] = useState<string>(
    areaByVersion[DEFAULT_VERSION]
      ? DEFAULT_VERSION
      : (availableVersions[0]?.value ?? latestVersion),
  );

  const entries = areaByVersion[version] ?? [];
  const visible = entries.slice(0, visibleCount);
  const hasMore = visibleCount < entries.length;
  const max = entries[0]?.count ?? 1;

  return (
    <DashCard>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold uppercase text-bpim-muted">
          県別利用者数
        </h3>
        <Select
          value={version}
          onValueChange={(v) => {
            setVersion(v);
            setVisibleCount(PAGE_SIZE);
          }}
        >
          <SelectTrigger className="h-7 w-28 border-bpim-border bg-bpim-surface-2/60 text-xs hover:bg-bpim-overlay focus:ring-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-bpim-border bg-bpim-bg">
            {versionsNonDisabledCollection.map((v) => (
              <SelectItem key={v.value} value={v.value} className="text-xs">
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
          さらに表示 ({entries.length - visibleCount} 件)
        </Button>
      )}
    </DashCard>
  );
}

export default AreaDistributionTable;
