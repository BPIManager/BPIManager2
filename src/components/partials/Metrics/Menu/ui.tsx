"use client";

import React from "react";
import NextLink from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuItemProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  icon: LucideIcon;
  title: string;
  subtitle?: string | React.ReactNode;
  iconColor?: string;
  href?: string;
  isExternal?: boolean;
}

export const ReusableMenuItem = ({
  icon: IconComponent,
  title,
  subtitle,
  iconColor = "text-bpim-text",
  href,
  isExternal,
  className,
  ...props
}: MenuItemProps) => {
  const Container = href ? (isExternal ? "a" : NextLink) : "button";

  return (
    // @ts-ignore
    <Container
      href={href || "#"}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className={cn(
        "group block w-full rounded-xl border border-bpim-border bg-bpim-bg/40 p-4 transition-all duration-200 mt-4",
        "hover:border-bpim-border hover:bg-bpim-surface-2/60 hover:no-underline",
        className,
      )}
      {...props}
    >
      <div className="flex w-full items-center gap-4">
        <div className={cn("shrink-0", iconColor)}>
          <IconComponent size={24} />
        </div>

        <div className="flex flex-1 flex-col items-start gap-0 text-left">
          <span className="text-base font-bold tracking-tight text-bpim-text">
            {title}
          </span>
          {subtitle && (
            <span className="text-xs text-bpim-muted">{subtitle}</span>
          )}
        </div>

        <div className="text-bpim-subtle transition-transform duration-300 ease-out group-hover:translate-x-1 group-hover:text-bpim-text">
          <ChevronRight size={20} />
        </div>
      </div>
    </Container>
  );
};
