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
  iconColor = "text-gray-200",
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
        "group block w-full rounded-xl border border-bpim-border bg-bpim-bg/40 p-4 transition-all duration-200",
        "hover:border-white/20 hover:bg-slate-800/60 hover:no-underline",
        className,
      )}
      {...props}
    >
      <div className="flex w-full items-center gap-4">
        <div className={cn("shrink-0", iconColor)}>
          <IconComponent size={24} />
        </div>

        <div className="flex flex-1 flex-col items-start gap-0 text-left">
          <span className="text-base font-bold tracking-tight text-white">
            {title}
          </span>
          {subtitle && (
            <span className="text-xs text-slate-500">{subtitle}</span>
          )}
        </div>

        <div className="text-slate-600 transition-transform duration-300 ease-out group-hover:translate-x-1 group-hover:text-slate-300">
          <ChevronRight size={20} />
        </div>
      </div>
    </Container>
  );
};
