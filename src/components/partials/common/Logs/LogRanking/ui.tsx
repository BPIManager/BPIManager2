import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import RankItem from "./item";
import SongDetailView from "@/components/partials/modal/SongDetail";
import OvertakeRankItem from "../LogOvertaken/item";
import VersionOvertakeRankItem from "../LogVersionOvertaken/item";
import type { BatchDetailItem } from "@/types/logs/batchDetail";
import type { SongWithScore } from "@/types/songs/score";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "@/hooks/common/useTranslation";

export interface FilterOption {
  value: string;
  label: string;
  count: number;
}

interface FilterSelect {
  value: string;
  onChange: (v: string) => void;
  allCount: number;
  options: FilterOption[];
}

interface DetailModalProps {
  song: SongWithScore | null;
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  version?: string;
  onSaved?: () => void;
}

interface LogRankViewProps {
  type: "growth" | "top" | "overtake" | "versionOvertake";
  isSharing?: boolean;
  config: { title: ReactNode; icon: LucideIcon; accentColor: string };
  hideNew: { visible: boolean; value: boolean; onChange: (v: boolean) => void };
  newOnly: { visible: boolean; value: boolean; onChange: (v: boolean) => void };
  rivalFilter?: FilterSelect;
  versionFilter?: FilterSelect;
  visibleSongs: BatchDetailItem[];
  onItemClick: (item: BatchDetailItem) => void;
  pagination: { hasMore: boolean; remainingCount: number; onLoadMore: () => void };
  detailModal: DetailModalProps;
}

const FilterSelectField = ({ filter }: { filter: FilterSelect }) => {
  const { t, tFormat } = useTranslation();
  return (
    <Select
      value={filter.value}
      onValueChange={(v) => filter.onChange(v === "all" ? "" : v)}
    >
      <SelectTrigger className="h-8 w-full text-xs bg-bpim-surface-2 border-bpim-border text-bpim-text">
        <SelectValue placeholder={t("logs.rank.all")} />
      </SelectTrigger>
      <SelectContent className="bg-bpim-surface-2 border-bpim-border text-bpim-text">
        <SelectItem value="all" className="text-xs">
          {t("logs.rank.all")}
          {tFormat("logs.rank.countSuffix", { count: filter.allCount })}
        </SelectItem>
        {filter.options.map((o) => (
          <SelectItem key={o.value} value={o.value} className="text-xs">
            {o.label}
            {tFormat("logs.rank.countSuffix", { count: o.count })}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const LogRankView = ({
  type,
  isSharing,
  config,
  hideNew,
  newOnly,
  rivalFilter,
  versionFilter,
  visibleSongs,
  onItemClick,
  pagination,
  detailModal,
}: LogRankViewProps) => {
  const { t, tFormat } = useTranslation();
  const Icon = config.icon;

  return (
    <div className="flex w-full flex-col gap-4 mt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", config.accentColor)} />
          <div className="text-sm font-bold tracking-widest text-bpim-text uppercase">
            {config.title}
          </div>
        </div>

        {hideNew.visible && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-bpim-muted">
              {t("logs.rank.hideNew")}
            </span>
            <Switch checked={hideNew.value} onCheckedChange={hideNew.onChange} />
          </div>
        )}

        {newOnly.visible && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-bpim-muted">
              {t("logs.rank.versionOvertake.newOnly")}
            </span>
            <Switch checked={newOnly.value} onCheckedChange={newOnly.onChange} />
          </div>
        )}
      </div>

      {rivalFilter && rivalFilter.options.length > 0 && (
        <FilterSelectField filter={rivalFilter} />
      )}

      {versionFilter && versionFilter.options.length > 0 && (
        <FilterSelectField filter={versionFilter} />
      )}

      <div className="flex flex-col overflow-hidden rounded-xl border border-bpim-border bg-bpim-bg">
        {visibleSongs.length === 0 ? (
          <div className="flex items-center justify-center p-8 bg-bpim-surface-2/60">
            <span className="text-xs text-bpim-muted">{t("logs.rank.empty")}</span>
          </div>
        ) : (
          visibleSongs.map((item, index) => (
            <div key={item.songId}>
              {type === "overtake" ? (
                <OvertakeRankItem item={item} onClick={() => onItemClick(item)} />
              ) : type === "versionOvertake" ? (
                <VersionOvertakeRankItem
                  item={item}
                  showAllDiffs={!newOnly.value}
                  onClick={() => onItemClick(item)}
                />
              ) : (
                <RankItem
                  isSharing={isSharing}
                  item={item}
                  rank={index + 1}
                  type={type}
                  onClick={() => onItemClick(item)}
                />
              )}
              {index !== visibleSongs.length - 1 && (
                <Separator className="bg-bpim-bg" />
              )}
            </div>
          ))
        )}
      </div>

      {pagination.hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="text-bpim-muted hover:bg-bpim-overlay/50 hover:text-bpim-text"
          onClick={pagination.onLoadMore}
        >
          {tFormat("logs.rank.loadMore", { count: pagination.remainingCount })}
        </Button>
      )}

      {detailModal.song && (
        <SongDetailView
          song={detailModal.song}
          isOpen={detailModal.isOpen}
          onClose={detailModal.onClose}
          userId={detailModal.userId}
          version={detailModal.version}
          songDomain="bpi"
          onSaved={detailModal.onSaved}
        />
      )}
    </div>
  );
};

export default LogRankView;
