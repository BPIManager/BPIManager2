"use client";

import * as React from "react";
import NextLink from "next/link";
import { cva } from "class-variance-authority";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { AppTabsListProps, AppTabsTriggerProps, AppTabsGroupProps } from "@/types/ui/tabs";

export const appTabsListVariants = cva("grid w-full items-stretch transition-all", {
  variants: {
    visual: {
      card: [
        "rounded-xl border border-bpim-border",
        "bg-bpim-card/50 shadow-inner",
        "p-1 h-12",
      ],
      pill: [
        "rounded-full border border-bpim-border",
        "bg-bpim-card/50",
        "p-1.5 h-11",
      ],
      flat: ["rounded-md border border-bpim-border", "bg-bpim-bg", "p-1 h-9"],
      minimal: ["rounded-md", "bg-bpim-surface-2/60", "p-1 h-9"],
    },
  },
  defaultVariants: { visual: "card" },
});


export const AppTabsList = React.forwardRef<
  React.ElementRef<typeof TabsList>,
  AppTabsListProps
>(({ visual, cols, className, style, ...props }, ref) => (
  <TabsList
    ref={ref}
    className={cn(appTabsListVariants({ visual }), className)}
    style={
      cols
        ? { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, ...style }
        : style
    }
    {...props}
  />
));
AppTabsList.displayName = "AppTabsList";

export const appTabsTriggerVariants = cva(
  [
    "flex h-full items-center justify-center gap-2",
    "text-xs font-bold transition-all",
    "data-[state=active]:shadow-lg data-[state=active]:text-white",
  ],
  {
    variants: {
      visual: {
        card: [
          "rounded-lg",
          "data-[state=active]:bg-bpim-primary data-[state=active]:text-bpim-text",
        ],
        pill: [
          "rounded-full",
          "data-[state=active]:bg-bpim-primary data-[state=active]:text-bpim-text",
        ],
        flat: [
          "rounded-sm",
          "data-[state=active]:bg-bpim-primary data-[state=active]:text-bpim-text",
        ],
        minimal: ["rounded-md", "data-[state=active]:bg-bpim-primary"],
      },
    },
    defaultVariants: { visual: "card" },
  },
);

export const AppTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsTrigger>,
  AppTabsTriggerProps
>(
  (
    {
      visual,
      icon: Icon,
      href,
      iconOnly = false,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const inner = (
      <>
        {Icon && <Icon className="h-4 w-4 shrink-0" />}
        <span className={cn(iconOnly ? "hidden sm:inline" : undefined)}>
          {children}
        </span>
      </>
    );

    if (href) {
      return (
        <TabsTrigger
          ref={ref}
          asChild
          className={cn(appTabsTriggerVariants({ visual }), className)}
          {...props}
        >
          <NextLink href={href}>{inner}</NextLink>
        </TabsTrigger>
      );
    }

    return (
      <TabsTrigger
        ref={ref}
        className={cn(appTabsTriggerVariants({ visual }), className)}
        {...props}
      >
        {inner}
      </TabsTrigger>
    );
  },
);
AppTabsTrigger.displayName = "AppTabsTrigger";

export const AppTabsGroup = ({
  tabs,
  visual,
  iconOnly,
  listClassName,
  triggerClassName,
  ...listProps
}: AppTabsGroupProps) => (
  <AppTabsList
    visual={visual}
    cols={tabs.length}
    className={listClassName}
    {...listProps}
  >
    {tabs.map((t) => (
      <AppTabsTrigger
        key={t.value}
        value={t.value}
        visual={visual}
        icon={t.icon}
        href={t.href}
        iconOnly={iconOnly}
        className={triggerClassName}
      >
        {t.label}
      </AppTabsTrigger>
    ))}
  </AppTabsList>
);

export { Tabs, TabsContent };
