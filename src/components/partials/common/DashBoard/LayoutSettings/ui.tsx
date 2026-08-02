"use client";

import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Eye, EyeOff, Columns, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { WidgetConfig, WidgetId, WIDGET_META } from "@/types/dashboard/layout";
import { useTranslation } from "@/hooks/common/useTranslation";
import { WIDGET_PREVIEWS } from "./widgetPreviews";

export function ColsPreview({ cols }: { cols: 1 | 2 }) {
  return (
    <div className="flex gap-0.5 w-12 h-6">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="flex-1 rounded-sm bg-current opacity-40" />
      ))}
    </div>
  );
}

interface WidgetRowProps {
  widget: WidgetConfig;
  mainCols: 1 | 2;
  onToggleVisible: () => void;
  onToggleWidth: () => void;
  isOverlay?: boolean;
}

export function WidgetRow({
  widget,
  mainCols,
  onToggleVisible,
  onToggleWidth,
  isOverlay = false,
}: WidgetRowProps) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id, disabled: isOverlay });

  const style = isOverlay
    ? {}
    : { transform: CSS.Transform.toString(transform), transition };

  const meta = WIDGET_META[widget.id];

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-lg border border-bpim-border bg-bpim-surface px-3 py-2 transition-shadow select-none",
        isDragging && !isOverlay && "opacity-40",
        isOverlay && "shadow-xl ring-1 ring-bpim-primary/40",
        !widget.visible && !isOverlay && "opacity-50",
      )}
    >
      <button
        {...(isOverlay ? {} : { ...attributes, ...listeners })}
        className="cursor-grab touch-none text-bpim-muted active:cursor-grabbing"
        aria-label={t("dashboard.layoutSettings.reorderAria")}
        tabIndex={-1}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {WIDGET_PREVIEWS[widget.id]}

      <span className="flex-1 truncate text-sm text-bpim-text">
        {t(meta.label)}
      </span>

      {widget.section === "main" && mainCols === 2 && (
        <button
          onClick={onToggleWidth}
          disabled={!widget.visible}
          className={cn(
            "flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors",
            widget.width === "half"
              ? "bg-bpim-primary/20 text-bpim-primary"
              : "bg-bpim-overlay/30 text-bpim-muted",
            !widget.visible && "pointer-events-none",
          )}
          title={
            widget.width === "half"
              ? t("dashboard.layoutSettings.halfTitle")
              : t("dashboard.layoutSettings.fullTitle")
          }
        >
          {widget.width === "half" ? (
            <Columns className="h-3 w-3" />
          ) : (
            <Square className="h-3 w-3" />
          )}
          <span>
            {widget.width === "half"
              ? "1/2"
              : t("dashboard.layoutSettings.fullWidth")}
          </span>
        </button>
      )}

      <button
        onClick={onToggleVisible}
        className="text-bpim-muted transition-colors hover:text-bpim-text"
        aria-label={
          widget.visible
            ? t("dashboard.layoutSettings.hideAria")
            : t("dashboard.layoutSettings.showAria")
        }
      >
        {widget.visible ? (
          <Eye className="h-4 w-4" />
        ) : (
          <EyeOff className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

export function DropZone({
  sectionId,
  label,
  widgets,
  mainCols,
  isDragTarget,
  onToggleVisible,
  onToggleWidth,
}: {
  sectionId: "main" | "sidebar";
  label: string;
  widgets: WidgetConfig[];
  mainCols: 1 | 2;
  isDragTarget: boolean;
  onToggleVisible: (id: WidgetId) => void;
  onToggleWidth: (id: WidgetId) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2">
      <h3
        className={cn(
          "text-sm font-semibold text-bpim-text transition-colors",
          isDragTarget && "text-bpim-primary",
        )}
      >
        {label}
        {sectionId === "main" && (
          <span className="ml-2 text-xs font-normal text-bpim-muted">
            {t("dashboard.layoutSettings.reorder")}
          </span>
        )}
      </h3>
      <SortableContext
        items={widgets.map((w) => w.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          className={cn(
            "flex min-h-14 flex-col gap-2 rounded-lg border-2 border-dashed p-2 transition-colors",
            isDragTarget
              ? "border-bpim-primary/60 bg-bpim-primary/5"
              : "border-bpim-border/40 bg-transparent",
          )}
        >
          {widgets.length === 0 && (
            <div className="flex items-center justify-center py-3 text-xs text-bpim-muted">
              {t("dashboard.layoutSettings.dropHere")}
            </div>
          )}
          {widgets.map((widget) => (
            <WidgetRow
              key={widget.id}
              widget={widget}
              mainCols={mainCols}
              onToggleVisible={() => onToggleVisible(widget.id)}
              onToggleWidth={() => onToggleWidth(widget.id)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
