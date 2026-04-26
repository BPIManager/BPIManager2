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
  { label: string; defaultWidth: "full" | "half"; defaultSection: "main" | "sidebar" }
> = {
  currentBpi: { label: "現在のBPI", defaultWidth: "half", defaultSection: "main" },
  activity: { label: "アクティビティ", defaultWidth: "half", defaultSection: "main" },
  rankDistribution: { label: "DJ段位分布", defaultWidth: "half", defaultSection: "main" },
  bpiDistribution: { label: "BPI分布", defaultWidth: "half", defaultSection: "main" },
  bpmBpiDistribution: { label: "BPM別BPI分布", defaultWidth: "full", defaultSection: "main" },
  bpiHistory: { label: "総合BPI推移", defaultWidth: "full", defaultSection: "main" },
  bpiBoxStats: { label: "BPI単日統計", defaultWidth: "full", defaultSection: "main" },
  rivalWinLoss: { label: "ライバル勝敗", defaultWidth: "full", defaultSection: "main" },
  radar: { label: "レーダーチャート", defaultWidth: "full", defaultSection: "main" },
  iidxTower: { label: "IIDXタワー", defaultWidth: "full", defaultSection: "sidebar" },
  rankingTabs: { label: "武器曲 / 伸びしろ / ニアロス", defaultWidth: "full", defaultSection: "sidebar" },
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
