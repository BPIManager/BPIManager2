"use client";

import { useState } from "react";
import {
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  UniqueIdentifier,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import {
  DashboardLayoutConfig,
  DEFAULT_LAYOUT_CONFIG,
  WidgetId,
} from "@/types/dashboard/layout";
import { moveToSection, mergePreservingOtherSection } from "@/components/partials/DashBoard/LayoutSettings/utils";

interface Options {
  config: DashboardLayoutConfig;
  onClose: () => void;
  onSave: (config: DashboardLayoutConfig) => void;
}

export function useDashboardLayoutEditor({ config, onClose, onSave }: Options) {
  const [draft, setDraft] = useState<DashboardLayoutConfig>(config);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [dragOverSection, setDragOverSection] = useState<"main" | "sidebar" | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const mainWidgets = draft.widgets.filter((w) => w.section === "main");
  const sidebarWidgets = draft.widgets.filter((w) => w.section === "sidebar");
  const activeWidget = activeId ? draft.widgets.find((w) => w.id === activeId) ?? null : null;

  const getWidgetSection = (id: UniqueIdentifier): "main" | "sidebar" | null =>
    draft.widgets.find((w) => w.id === id)?.section ?? null;

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setDraft(config);
    } else {
      onClose();
    }
  };

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
        moveToSection(prev, active.id as WidgetId, overSection, overId as WidgetId),
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
        const otherWidgets = prev.widgets.filter((w) => w.section !== activeSection);
        const reorderedWidgets = reordered.map((id) => prev.widgets.find((w) => w.id === id)!);
        return {
          ...prev,
          widgets: mergePreservingOtherSection(otherWidgets, reorderedWidgets, activeSection!),
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

  return {
    draft,
    activeId,
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
  };
}
