import { useMemo, useState } from "react";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Swords } from "lucide-react";
import type { BatchDetailItem } from "@/types/logs/batchDetail";
import { SongWithScore } from "@/types/songs/score";
import VersionOvertakeRankItem from "./item";
import { useLogRank } from "@/hooks/batches/useLogRank";
import SongDetailView from "@/components/partials/modal/SongDetail/ui";
import {
  getVersionNameFromNumber,
  versionsNonDisabledCollection,
} from "@/constants/iidx/versionTitles";
import { useTranslation } from "@/hooks/common/useTranslation";

interface Props {
  details: BatchDetailItem[];
  currentVersion: string;
  compareVersion: string | undefined;
  onCompareVersionChange: (version: string) => void;
  isSharing?: boolean;
}

const LogVersionOvertaken = ({
  details,
  currentVersion,
  compareVersion,
  onCompareVersionChange,
  isSharing,
}: Props) => {
  const { t, tFormat } = useTranslation();
  const [selectedSong, setSelectedSong] = useState<SongWithScore | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const versionOptions = useMemo(
    () =>
      versionsNonDisabledCollection.filter(
        (v) => v.value !== currentVersion && v.value !== "INF",
      ),
    [currentVersion],
  );

  const { visibleSongs, hasMore, remainingCount, loadMore } = useLogRank(
    details,
    "versionOvertake",
  );

  const handleOpenDetail = (item: BatchDetailItem) => {
    setSelectedSong({
      ...item,
      logId: null,
      scoreAt: null,
      bpm: item.bpm ?? null,
      releasedVersion: item.releasedVersion ?? null,
      wrScore: item.wrScore ?? null,
      kaidenAvg: item.kaidenAvg ?? null,
      coef: item.coef ?? null,
      exScore: item.current.exScore,
      bpi: item.current.bpi,
      clearState: item.current.clearState,
      missCount: item.current.missCount,
    });
    setIsDetailOpen(true);
  };

  return (
    <div className="flex w-full flex-col gap-4 mt-4">
      <div className="flex items-center gap-2">
        <Swords className="h-4 w-4 text-bpim-warning" />
        <div className="text-sm font-bold tracking-widest text-bpim-text uppercase">
          {tFormat("logs.rank.versionOvertake.title", {
            version: compareVersion
              ? getVersionNameFromNumber(compareVersion)
              : "",
          })}
        </div>
      </div>

      {!isSharing && (
        <Select
          value={compareVersion ?? ""}
          onValueChange={onCompareVersionChange}
        >
          <SelectTrigger className="h-8 w-full text-xs bg-bpim-surface-2 border-bpim-border text-bpim-text">
            <SelectValue placeholder={t("logs.rank.versionOvertake.select")} />
          </SelectTrigger>
          <SelectContent className="bg-bpim-surface-2 border-bpim-border text-bpim-text">
            {versionOptions.map((v) => (
              <SelectItem key={v.value} value={v.value} className="text-xs">
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div className="flex flex-col overflow-hidden rounded-xl border border-bpim-border bg-bpim-bg">
        {visibleSongs.length === 0 ? (
          <div className="flex items-center justify-center p-8 bg-bpim-surface-2/60">
            <span className="text-xs text-bpim-muted">
              {t("logs.rank.empty")}
            </span>
          </div>
        ) : (
          visibleSongs.map((item, index) => (
            <div key={item.songId}>
              <VersionOvertakeRankItem
                item={item}
                onClick={() => handleOpenDetail(item)}
              />
              {index !== visibleSongs.length - 1 && (
                <Separator className="bg-bpim-bg" />
              )}
            </div>
          ))
        )}
      </div>

      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="text-bpim-muted hover:bg-bpim-overlay/50 hover:text-bpim-text"
          onClick={loadMore}
        >
          {tFormat("logs.rank.loadMore", { count: remainingCount })}
        </Button>
      )}

      {selectedSong && (
        <SongDetailView
          song={selectedSong}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
        />
      )}
    </div>
  );
};

export default LogVersionOvertaken;
