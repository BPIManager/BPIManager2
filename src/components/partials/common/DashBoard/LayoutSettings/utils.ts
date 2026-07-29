import {
  DashboardLayoutConfig,
  WidgetConfig,
  WidgetId,
} from "@/types/dashboard/layout";

export function moveToSection(
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

export function mergePreservingOtherSection(
  others: WidgetConfig[],
  reordered: WidgetConfig[],
  reorderedSection: "main" | "sidebar",
): WidgetConfig[] {
  if (reorderedSection === "main") {
    return [...reordered, ...others];
  }
  return [...others, ...reordered];
}
