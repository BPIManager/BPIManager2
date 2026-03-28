import * as React from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

/** AppTabsList / AppTabsTrigger の visual バリアント */
export type AppTabsVisual = "card" | "pill" | "flat" | "minimal";

export interface AppTabsListProps
  extends Omit<React.ComponentProps<typeof TabsList>, "variant"> {
  visual?: AppTabsVisual | null;
  cols?: number;
}

export interface AppTabsTriggerItem {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  href?: string;
}

export interface AppTabsTriggerProps
  extends Omit<React.ComponentProps<typeof TabsTrigger>, "value"> {
  visual?: AppTabsVisual | null;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  href?: string;
  iconOnly?: boolean;
  children: React.ReactNode;
}

export interface AppTabsGroupProps extends Omit<
  AppTabsListProps,
  "cols" | "children"
> {
  tabs: AppTabsTriggerItem[];
  iconOnly?: boolean;
  listClassName?: string;
  triggerClassName?: string;
}
