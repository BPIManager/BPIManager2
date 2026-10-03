import type { WidgetId } from "@/types/dashboard/layout";
import { basicPreviews } from "./basic";
import { chartsPreviews } from "./charts";
import { listsPreviews } from "./lists";

export const WIDGET_PREVIEWS: Record<WidgetId, React.ReactNode> = {
  ...basicPreviews,
  ...chartsPreviews,
  ...listsPreviews,
};
