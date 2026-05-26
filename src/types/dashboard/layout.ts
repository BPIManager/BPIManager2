import type { TranslationKey } from "@/lib/i18n/translations";

export const ALL_WIDGET_IDS = [
  "currentBpi",
  "activity",
  "rankDistribution",
  "bpiDistribution",
  "bpmBpiDistribution",
  "bpiHistory",
  "bpiBoxStats",
  "rivalWinLoss",
  "radar",
  "iidxTower",
  "rankingTabs",
] as const;

export type WidgetId = (typeof ALL_WIDGET_IDS)[number];

export const WIDGET_META: Record<
  WidgetId,
  { label: TranslationKey; defaultWidth: "full" | "half"; defaultSection: "main" | "sidebar" }
> = {
  currentBpi: { label: "widget.currentBpi", defaultWidth: "half", defaultSection: "main" },
  activity: { label: "widget.activity", defaultWidth: "half", defaultSection: "main" },
  rankDistribution: { label: "widget.rankDistribution", defaultWidth: "half", defaultSection: "main" },
  bpiDistribution: { label: "widget.bpiDistribution", defaultWidth: "half", defaultSection: "main" },
  bpmBpiDistribution: { label: "widget.bpmBpiDistribution", defaultWidth: "full", defaultSection: "main" },
  bpiHistory: { label: "widget.bpiHistory", defaultWidth: "full", defaultSection: "main" },
  bpiBoxStats: { label: "widget.bpiBoxStats", defaultWidth: "full", defaultSection: "main" },
  rivalWinLoss: { label: "widget.rivalWinLoss", defaultWidth: "full", defaultSection: "main" },
  radar: { label: "widget.radar", defaultWidth: "full", defaultSection: "main" },
  iidxTower: { label: "widget.iidxTower", defaultWidth: "full", defaultSection: "sidebar" },
  rankingTabs: { label: "widget.rankingTabs", defaultWidth: "full", defaultSection: "sidebar" },
};

export interface WidgetConfig {
  id: WidgetId;
  visible: boolean;
  section: "main" | "sidebar";
  width: "full" | "half";
}

export interface DashboardLayoutConfig {
  version: 2;
  mainCols: 1 | 2;
  widgets: WidgetConfig[];
}

export const DEFAULT_LAYOUT_CONFIG: DashboardLayoutConfig = {
  version: 2,
  mainCols: 2,
  widgets: ALL_WIDGET_IDS.map((id) => ({
    id,
    visible: true,
    section: WIDGET_META[id].defaultSection,
    width: WIDGET_META[id].defaultWidth,
  })),
};
