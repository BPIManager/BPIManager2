"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  UniqueIdentifier,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Eye,
  EyeOff,
  RotateCcw,
  Columns,
  Square,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DashboardLayoutConfig,
  DEFAULT_LAYOUT_CONFIG,
  WidgetConfig,
  WidgetId,
  WIDGET_META,
} from "@/types/dashboard/layout";

interface WidgetRowProps {
  widget: WidgetConfig;
  mainCols: 1 | 2;
  onToggleVisible: () => void;
  onToggleWidth: () => void;
  isOverlay?: boolean;
}

function WidgetRow({
  widget,
  mainCols,
  onToggleVisible,
  onToggleWidth,
  isOverlay = false,
}: WidgetRowProps) {
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
        "flex items-center gap-3 rounded-lg border border-bpim-border bg-bpim-surface px-3 py-2.5 transition-shadow select-none",
        isDragging && !isOverlay && "opacity-40",
        isOverlay && "shadow-xl ring-1 ring-bpim-primary/40",
        !widget.visible && !isOverlay && "opacity-50",
      )}
    >
      <button
        {...(isOverlay ? {} : { ...attributes, ...listeners })}
        className="cursor-grab touch-none text-bpim-muted active:cursor-grabbing"
        aria-label="並び替え"
        tabIndex={-1}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <span className="flex-1 truncate text-sm text-bpim-text">
        {meta.label}
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
          title={widget.width === "half" ? "2列中1列" : "全幅"}
        >
          {widget.width === "half" ? (
            <Columns className="h-3 w-3" />
          ) : (
            <Square className="h-3 w-3" />
          )}
          <span>{widget.width === "half" ? "1/2" : "全幅"}</span>
        </button>
      )}

      <button
        onClick={onToggleVisible}
        className="text-bpim-muted transition-colors hover:text-bpim-text"
        aria-label={widget.visible ? "非表示にする" : "表示する"}
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

function DropZone({
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
            ドラッグで並び替え・移動
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
              ここにドロップ
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

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: DashboardLayoutConfig;
  onSave: (config: DashboardLayoutConfig) => void;
}

export function DashboardLayoutSettingsModal({
  isOpen,
  onClose,
  config,
  onSave,
}: Props) {
  const [draft, setDraft] = useState<DashboardLayoutConfig>(config);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [dragOverSection, setDragOverSection] = useState<
    "main" | "sidebar" | null
  >(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setDraft(config);
    } else {
      onClose();
    }
  };

  const mainWidgets = draft.widgets.filter((w) => w.section === "main");
  const sidebarWidgets = draft.widgets.filter((w) => w.section === "sidebar");

  const getWidgetSection = (id: UniqueIdentifier): "main" | "sidebar" | null =>
    draft.widgets.find((w) => w.id === id)?.section ?? null;

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id);
    setDragOverSection(getWidgetSection(active.id));
  };

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) {
      setDragOverSection(null);
      return;
    }

    const overId = over.id;
    if (overId === "main" || overId === "sidebar") {
      setDragOverSection(overId);
      setDraft((prev) => moveToSection(prev, active.id as WidgetId, overId));
      return;
    }

    const overSection = getWidgetSection(overId);
    const activeSection = getWidgetSection(active.id);
    setDragOverSection(overSection);

    if (overSection && overSection !== activeSection) {
      setDraft((prev) =>
        moveToSection(
          prev,
          active.id as WidgetId,
          overSection,
          overId as WidgetId,
        ),
      );
    }
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    setDragOverSection(null);
    if (!over) return;

    const activeSection = getWidgetSection(active.id);
    const overId = over.id;
    if (overId === "main" || overId === "sidebar") return;
    const overSection = getWidgetSection(overId);

    if (activeSection === overSection && active.id !== overId) {
      setDraft((prev) => {
        const sectionItems = prev.widgets
          .filter((w) => w.section === activeSection)
          .map((w) => w.id);
        const oldIndex = sectionItems.indexOf(active.id as WidgetId);
        const newIndex = sectionItems.indexOf(overId as WidgetId);
        const reordered = arrayMove(sectionItems, oldIndex, newIndex);
        const otherWidgets = prev.widgets.filter(
          (w) => w.section !== activeSection,
        );
        const reorderedWidgets = reordered.map(
          (id) => prev.widgets.find((w) => w.id === id)!,
        );
        return {
          ...prev,
          widgets: mergePreservingOtherSection(
            otherWidgets,
            reorderedWidgets,
            activeSection!,
          ),
        };
      });
    }
  };

  const toggleVisible = (id: WidgetId) => {
    setDraft((prev) => ({
      ...prev,
      widgets: prev.widgets.map((w) =>
        w.id === id ? { ...w, visible: !w.visible } : w,
      ),
    }));
  };

  const toggleWidth = (id: WidgetId) => {
    setDraft((prev) => ({
      ...prev,
      widgets: prev.widgets.map((w) =>
        w.id === id ? { ...w, width: w.width === "half" ? "full" : "half" } : w,
      ),
    }));
  };

  const setMainCols = (cols: 1 | 2) => {
    setDraft((prev) => ({ ...prev, mainCols: cols }));
  };

  const handleSave = () => {
    onSave(draft);
    onClose();
  };

  const handleReset = () => {
    setDraft(DEFAULT_LAYOUT_CONFIG);
  };

  const activeWidget = activeId
    ? draft.widgets.find((w) => w.id === activeId)
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-lg border-bpim-border bg-bpim-bg p-0 overflow-hidden shadow-2xl rounded-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-bpim-border">
          <DialogTitle className="text-lg font-bold text-bpim-text">
            レイアウト設定
          </DialogTitle>
          <p className="text-xs text-bpim-muted mt-1">
            設定はこの端末のみに保存されます
          </p>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[65vh] p-6 flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-bpim-text">
              カラム数（メインエリア）
            </h3>
            <div className="flex gap-2">
              {([1, 2] as const).map((cols) => (
                <button
                  key={cols}
                  onClick={() => setMainCols(cols)}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-1.5 rounded-lg border p-3 text-sm transition-colors",
                    draft.mainCols === cols
                      ? "border-bpim-primary bg-bpim-primary/10 text-bpim-primary font-semibold"
                      : "border-bpim-border bg-bpim-surface text-bpim-muted hover:border-bpim-primary/50",
                  )}
                >
                  <ColsPreview cols={cols} />
                  <span>{cols}列</span>
                </button>
              ))}
            </div>
          </section>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex flex-col gap-6">
              <DropZone
                sectionId="main"
                label="メインエリア"
                widgets={mainWidgets}
                mainCols={draft.mainCols}
                isDragTarget={dragOverSection === "main"}
                onToggleVisible={toggleVisible}
                onToggleWidth={toggleWidth}
              />
              <DropZone
                sectionId="sidebar"
                label="サイドバー"
                widgets={sidebarWidgets}
                mainCols={draft.mainCols}
                isDragTarget={dragOverSection === "sidebar"}
                onToggleVisible={toggleVisible}
                onToggleWidth={toggleWidth}
              />
            </div>

            <DragOverlay>
              {activeWidget && (
                <WidgetRow
                  widget={activeWidget}
                  mainCols={draft.mainCols}
                  onToggleVisible={() => {}}
                  onToggleWidth={() => {}}
                  isOverlay
                />
              )}
            </DragOverlay>
          </DndContext>
        </div>

        <DialogFooter className="flex flex-row items-center justify-between gap-3 p-6 border-t border-bpim-border sm:flex-row">
          <Button
            variant="ghost"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-bpim-muted hover:text-bpim-text"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            デフォルトに戻す
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={onClose}
              className="h-9 px-4 text-bpim-muted hover:text-bpim-text hover:bg-bpim-overlay/50"
            >
              キャンセル
            </Button>
            <Button
              onClick={handleSave}
              className="h-9 px-6 font-bold bg-bpim-primary hover:bg-bpim-primary text-bpim-text"
            >
              保存
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function moveToSection(
  prev: DashboardLayoutConfig,
  activeId: WidgetId,
  targetSection: "main" | "sidebar",
  beforeId?: WidgetId,
): DashboardLayoutConfig {
  const widget = prev.widgets.find((w) => w.id === activeId);
  if (!widget || widget.section === targetSection) return prev;
  const updated = { ...widget, section: targetSection };
  const rest = prev.widgets.filter((w) => w.id !== activeId);
  if (!beforeId) {
    return { ...prev, widgets: [...rest, updated] };
  }
  const insertIdx = rest.findIndex((w) => w.id === beforeId);
  if (insertIdx === -1) return { ...prev, widgets: [...rest, updated] };
  const next = [...rest];
  next.splice(insertIdx, 0, updated);
  return { ...prev, widgets: next };
}

function mergePreservingOtherSection(
  others: WidgetConfig[],
  reordered: WidgetConfig[],
  reorderedSection: "main" | "sidebar",
): WidgetConfig[] {
  if (reorderedSection === "main") {
    return [...reordered, ...others];
  }
  return [...others, ...reordered];
}

function ColsPreview({ cols }: { cols: 1 | 2 }) {
  return (
    <div className="flex gap-0.5 w-12 h-6">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="flex-1 rounded-sm bg-current opacity-40" />
      ))}
    </div>
  );
}
