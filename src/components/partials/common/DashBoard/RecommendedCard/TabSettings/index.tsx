import { useState } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/common/useTranslation";
import type { RankingTabEntry } from "@/lib/dashboard/rankingTabs";
import { TabSettingRow } from "./ui";

interface TabSettingsDialogProps {
  isOpen: boolean;
  entries: RankingTabEntry[];
  onSave: (entries: RankingTabEntry[]) => Promise<void>;
  onClose: () => void;
}

const TabSettingsDialog = ({
  isOpen,
  entries,
  onSave,
  onClose,
}: TabSettingsDialogProps) => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<RankingTabEntry[]>(entries);
  const [isSaving, setIsSaving] = useState(false);

  const update = (index: number, patch: Partial<RankingTabEntry>) =>
    setDraft((d) => d.map((e, i) => (i === index ? { ...e, ...patch } : e)));

  const [activeKey, setActiveKey] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );
  const activeEntry = draft.find((e) => e.key === activeKey) ?? null;

  const handleDragStart = (event: DragStartEvent) =>
    setActiveKey(String(event.active.id));

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveKey(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setDraft((d) => {
      const from = d.findIndex((e) => e.key === active.id);
      const to = d.findIndex((e) => e.key === over.id);
      return from < 0 || to < 0 ? d : arrayMove(d, from, to);
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(draft);
      onClose();
    } catch {
      toast.error(t("analytics.saved.toastError"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("dashboard.ranking.settings.title")}</DialogTitle>
        </DialogHeader>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveKey(null)}
        >
          <SortableContext
            items={draft.map((e) => e.key)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex max-h-96 flex-col gap-2 overflow-y-auto">
              {draft.map((entry, i) => (
                <TabSettingRow
                  key={entry.key}
                  entry={entry}
                  onToggle={(visible) => update(i, { visible })}
                  onTargetChange={(targetIndex) => update(i, { targetIndex })}
                />
              ))}
            </div>
          </SortableContext>
          {/* Dialog は translate で中央寄せされており、fixed の基準がずれるため body へポータルする */}
          {createPortal(
            <DragOverlay zIndex={1010}>
              {activeEntry && (
                <TabSettingRow
                  isOverlay
                  entry={activeEntry}
                  onToggle={() => {}}
                  onTargetChange={() => {}}
                />
              )}
            </DragOverlay>,
            document.body,
          )}
        </DndContext>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            disabled={isSaving}
            onClick={handleSave}
            className="bg-bpim-primary font-bold text-white hover:bg-bpim-primary/80"
          >
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TabSettingsDialog;
