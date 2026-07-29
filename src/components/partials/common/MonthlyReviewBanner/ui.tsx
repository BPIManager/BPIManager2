"use client";

import NextLink from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  href: string;
  title: string;
  desc: string;
  buttonLabel: string;
}

export const MonthlyReviewBannerUI = ({
  href,
  title,
  desc,
  buttonLabel,
}: Props) => (
  <div className="flex items-center justify-between gap-3 rounded-xl border border-bpim-border bg-linear-to-r from-bpim-surface to-bpim-surface-2 px-4 py-3">
    <div className="flex items-center gap-2 min-w-0">
      <Sparkles className="h-4 w-4 shrink-0 text-amber-400" />
      <div className="min-w-0">
        <p className="text-sm font-bold text-bpim-text leading-tight">
          {title}
        </p>
        <p className="text-[11px] text-bpim-muted truncate">{desc}</p>
      </div>
    </div>
    <Button
      asChild
      size="sm"
      variant="secondary"
      className="shrink-0 text-xs h-7"
    >
      <NextLink href={href}>{buttonLabel}</NextLink>
    </Button>
  </div>
);
