"use client";

import {
  DndContext,
  closestCenter,
  DragOverlay,
} from "@dnd-kit/core";
import { RotateCcw } from "lucide-react";
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
} from "@/types/dashboard/layout";
import { ColsPreview, DropZone, WidgetRow } from "./ui";
import { useDashboardLayoutEditor } from "@/hooks/dashboard/useDashboardLayoutEditor";

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
  const {
    draft,
    dragOverSection,
    sensors,
    mainWidgets,
    sidebarWidgets,
    activeWidget,
    handleOpenChange,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    toggleVisible,
    toggleWidth,
    setMainCols,
    handleSave,
    handleReset,
  } = useDashboardLayoutEditor({ config, onClose, onSave });

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="flex flex-col w-[92vw] max-w-lg max-h-[90dvh] border-bpim-border bg-bpim-bg p-0 overflow-hidden shadow-2xl rounded-2xl">
        <DialogHeader className="shrink-0 p-5 pb-4 border-b border-bpim-border">
          <DialogTitle className="text-lg font-bold text-bpim-text">
            レイアウト設定
          </DialogTitle>
          <p className="text-xs text-bpim-muted mt-1">
            設定はこの端末のみに保存されます
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6 min-h-0">
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
                  onToggleVisible={() => { }}
                  onToggleWidth={() => { }}
                  isOverlay
                />
              )}
            </DragOverlay>
          </DndContext>
        </div>

        <DialogFooter className="shrink-0 flex flex-row items-center justify-between gap-2 px-5 py-4 border-t border-bpim-border">
          <Button
            variant="ghost"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-bpim-muted hover:text-bpim-text px-2"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            デフォルトに戻す
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={onClose}
              className="h-9 px-3 text-bpim-muted hover:text-bpim-text hover:bg-bpim-overlay/50"
            >
              キャンセル
            </Button>
            <Button
              onClick={handleSave}
              className="h-9 px-5 font-bold bg-bpim-primary hover:bg-bpim-primary text-bpim-text"
            >
              保存
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
