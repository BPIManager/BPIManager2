"use client";

import { SongWithScore } from "@/types/songs/score";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/hooks/common/useTranslation";
import InfoHint from "@/components/partials/common/InfoHint/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import dayjs from "@/lib/dayjs";
import type { ArenaAverages } from "@/hooks/metrics/useArenaAveragesForSong";
import { BPIChart } from "./BPIChart";

interface ChartDataPoint {
  label: string;
  count: number;
  bpi: number;
}

interface StatsTabViewProps {
  song: SongWithScore;
  chartData: ChartDataPoint[];
  maxScore: number;
  refScore?: number;
  refLabel?: string;
  selectedRef: string;
  onSelectedRefChange: (value: string) => void;
  arenaAverages: ArenaAverages | null;
}

export const StatsTabView = ({
  song,
  chartData,
  maxScore,
  refScore,
  refLabel,
  selectedRef,
  onSelectedRefChange,
  arenaAverages,
}: StatsTabViewProps) => {
  const { t } = useTranslation();

  return (
  <>
    <div className="flex items-center justify-end px-1 gap-2 pt-2">
      <span className="text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
        比較
      </span>
      <Select value={selectedRef} onValueChange={onSelectedRefChange}>
        <SelectTrigger className="h-6 w-30 text-[10px] px-2 py-0">
          <SelectValue placeholder="-" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none" className="text-xs text-bpim-muted">
            非表示
          </SelectItem>
          {["A1", "A2", "A3", "A4", "A5"].map((rank) => (
            <SelectItem
              key={rank}
              value={rank}
              className="text-xs"
              disabled={!arenaAverages}
            >
              {rank}平均
            </SelectItem>
          ))}
          <SelectItem value="rival-avg" className="text-xs">
            ライバル平均
          </SelectItem>
          <SelectItem value="rival-top" className="text-xs">
            ライバルトップ
          </SelectItem>
          <SelectItem value="personal-best" className="text-xs">
            自己歴代
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <BPIChart
      key={song.songId}
      data={chartData}
      maxScore={maxScore}
      song={song}
      refScore={refScore}
      refLabel={refLabel}
    />

    <div className="mt-4 rounded-xl border border-bpim-border bg-bpim-surface-2/60 p-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-bpim-muted uppercase">
            Notes / Max
          </span>
          <span className="font-mono text-sm font-black text-bpim-text">
            {song.notes} / {song.notes * 2}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-bpim-muted uppercase">
            WR
          </span>
          <span className="font-mono text-sm font-black text-bpim-text">
            {song.wrScore ?? 0}
            <span className="text-bpim-muted">
              {" / "}
              {Number(((song.wrScore ?? 0) / (song.notes * 2)) * 100).toFixed(
                2,
              )}{" "}
              %
            </span>
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-bpim-muted uppercase">
            スコア平均
          </span>
          <span className="font-mono text-sm font-black text-bpim-text">
            {song.kaidenAvg ?? 0}
            <span className="text-bpim-muted">
              {" / "}
              {Number(((song.kaidenAvg ?? 0) / (song.notes * 2)) * 100).toFixed(
                2,
              )}{" "}
              %
            </span>
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-bpim-muted uppercase">
            譜面係数
          </span>
          <span className="font-mono text-sm font-black text-bpim-text">
            {song.coef ?? -1}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-xs font-bold text-bpim-muted uppercase">
            {t("newBpi.params.mu.label")}
            <InfoHint
              label={t("newBpi.params.mu.label")}
              text={t("newBpi.params.mu.hint")}
            />
          </span>
          <span className="font-mono text-sm font-black text-bpim-text">
            {song.mu !== null && song.mu !== undefined
              ? song.mu.toFixed(4)
              : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-xs font-bold text-bpim-muted uppercase">
            {t("newBpi.params.sigma.label")}
            <InfoHint
              label={t("newBpi.params.sigma.label")}
              text={t("newBpi.params.sigma.hint")}
            />
          </span>
          <span className="font-mono text-sm font-black text-bpim-text">
            {song.sigma !== null && song.sigma !== undefined
              ? song.sigma.toFixed(4)
              : "—"}
          </span>
        </div>
        <Separator className="my-1 bg-bpim-border" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-bpim-muted uppercase">
            クリアランプ
          </span>
          <span className="font-mono text-sm font-black text-bpim-text">
            {song.clearState || "NO PLAY"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-bpim-muted uppercase">
            BP
          </span>
          <span className="font-mono text-sm font-black text-bpim-danger">
            {song.missCount ?? "-"}
          </span>
        </div>
        {song.scoreAt && (
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-bpim-muted uppercase">
              最終更新
            </span>
            <span className="font-mono text-sm font-black">
              {dayjs(song.scoreAt).format("YYYY/MM/DD HH:mm")} (
              {dayjs(song.scoreAt).fromNow()})
            </span>
          </div>
        )}
      </div>
    </div>
  </>
  );
};
