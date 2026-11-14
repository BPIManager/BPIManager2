import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/hooks/common/useTranslation";
import type { RankingTabEntry } from "@/lib/dashboard/rankingTabs";
import type { TranslationKey } from "@/lib/i18n/translations";

const BUILTIN_LABELS: Record<string, TranslationKey> = {
  weapons: "dashboard.ranking.weapons",
  potential: "dashboard.ranking.potential",
  nearLose: "dashboard.ranking.nearLose",
};

export const TabSettingRow = ({
  entry,
  onToggle,
  onTargetChange,
  isOverlay = false,
}: {
  entry: RankingTabEntry;
  onToggle: (visible: boolean) => void;
  onTargetChange: (index: number) => void;
  /** DragOverlay 内の見た目専用（ソート対象にしない） */
  isOverlay?: boolean;
}) => {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: entry.key, disabled: isOverlay });
  const style = isOverlay
    ? {}
    : { transform: CSS.Transform.toString(transform), transition };
  const label = entry.comparison
    ? entry.comparison.name
    : t(BUILTIN_LABELS[entry.key]);
  const targets = entry.comparison?.targets ?? [];

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      style={style}
      className={cn(
        "flex select-none flex-col gap-2 rounded-lg border border-bpim-border bg-bpim-surface-2/60 p-3",
        isDragging && !isOverlay && "opacity-40",
        isOverlay && "bg-bpim-surface shadow-xl ring-1 ring-bpim-primary/40",
        !entry.visible && !isOverlay && "opacity-50",
      )}
    >
      <div className="flex items-center gap-2">
        <button
          {...(isOverlay ? {} : { ...attributes, ...listeners })}
          className="cursor-grab touch-none text-bpim-muted active:cursor-grabbing"
          aria-label={t("dashboard.layoutSettings.reorderAria")}
          tabIndex={-1}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="min-w-0 flex-1 truncate text-sm font-bold text-bpim-text">
          {label}
        </span>
        <Switch
          checked={entry.visible}
          onCheckedChange={onToggle}
          aria-label={t("dashboard.ranking.settings.visible")}
        />
      </div>
      {targets.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-xs text-bpim-muted">
            {t("dashboard.ranking.settings.target")}
          </span>
          <Select
            value={String(entry.targetIndex)}
            onValueChange={(v) => onTargetChange(Number(v))}
          >
            <SelectTrigger className="h-8 w-full text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-bpim-border text-bpim-text">
              {targets.map((target, i) => (
                <SelectItem key={i} value={String(i)} className="text-xs">
                  {target.accessible ? target.label : t("analytics.saved.inaccessible")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};
