import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DIFF_COLORS as diffColors } from "@/constants/theme/difficultyColors";
import { getLampClass } from "@/components/partials/common/Table/ui";
import { useTranslation } from "@/hooks/common/useTranslation";
import { clickableProps } from "@/utils/common/clickableProps";
import { cn } from "@/lib/utils";
import type { SongWithScore } from "@/types/songs/score";

export const PanelMessage = ({
  icon,
  children,
}: {
  icon?: ReactNode;
  children: ReactNode;
}) => (
  <div className="flex items-center justify-center gap-2 p-6 text-sm text-bpim-muted">
    {icon}
    {children}
  </div>
);

type Row = SongWithScore & { remaining: number };

const SavedComparisonRow = ({
  row,
  onClick,
}: {
  row: Row;
  onClick: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <div
      {...clickableProps(onClick)}
      className={cn(
        "group relative flex cursor-pointer items-center justify-between gap-3 border-b border-bpim-border p-3 pl-4 transition-colors duration-200",
        "hover:bg-bpim-overlay/50",
      )}
    >
      <div className={cn("absolute inset-y-0 left-0 z-10 w-1", getLampClass(row.clearState))} />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-sm font-bold tracking-tight text-bpim-text">
          {row.title}
        </span>
        <div className="flex items-center gap-1.5">
          <Badge
            className={cn(
              "flex h-3.5 items-center rounded-sm border-none px-1 text-[9px] text-white",
              diffColors[row.difficulty] || "bg-bpim-surface-2",
            )}
          >
            {String(row.difficulty).charAt(0).toUpperCase()}
          </Badge>
          <span className="text-[10px] font-bold text-bpim-muted">
            ☆{row.difficultyLevel}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-4 font-mono">
        <div className="flex flex-col items-end">
          <span className="text-[9px] font-bold leading-none text-bpim-subtle">EX</span>
          <span className="text-sm font-bold leading-tight text-bpim-text">
            {row.exScore}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[9px] font-bold leading-none text-bpim-warning">
            {t("dashboard.ranking.toBeat")}
          </span>
          <span className="text-sm font-bold leading-tight text-bpim-warning">
            {row.remaining}
            {t("dashboard.ranking.scoreUnit")}
          </span>
        </div>
      </div>
    </div>
  );
};

export const SavedComparisonList = ({
  label,
  rows,
  isLoading,
  isError,
  onSelect,
}: {
  label: string;
  rows: Row[];
  isLoading: boolean;
  isError: boolean;
  onSelect: (song: SongWithScore) => void;
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col">
      <div className="border-b border-bpim-border bg-bpim-surface-1 px-3 py-1.5 text-[10px] font-bold text-bpim-subtle">
        {t("dashboard.ranking.savedTarget")}
        <span className="ml-1 text-bpim-text">{label}</span>
      </div>
      {isLoading ? (
        <div className="flex flex-col gap-2 p-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : isError ? (
        <PanelMessage>{t("analytics.saved.toastError")}</PanelMessage>
      ) : rows.length === 0 ? (
        <PanelMessage>{t("dashboard.ranking.noSongs")}</PanelMessage>
      ) : (
        rows.map((row) => (
          <SavedComparisonRow
            key={`${row.songId}-${row.difficulty}`}
            row={row}
            onClick={() => onSelect(row)}
          />
        ))
      )}
    </div>
  );
};
