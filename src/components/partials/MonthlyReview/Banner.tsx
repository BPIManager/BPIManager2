"use client";

import NextLink from "next/link";
import { useTranslation } from "@/hooks/common/useTranslation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  userId: string;
  month: string; // YYYY-MM
  version?: string;
}

export const MonthlyReviewBanner = ({ userId, month, version }: Props) => {
  const { t } = useTranslation();
  const href = version
    ? `/users/${userId}/monthly-review/${month}?version=${version}`
    : `/users/${userId}/monthly-review/${month}`;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-bpim-border bg-linear-to-r from-bpim-surface to-bpim-surface-2 px-4 py-3">
      <div className="flex items-center gap-2 min-w-0">
        <Sparkles className="h-4 w-4 shrink-0 text-amber-400" />
        <div className="min-w-0">
          <p className="text-sm font-bold text-bpim-text leading-tight">
            {t("monthlyReview.banner.title")}
          </p>
          <p className="text-[11px] text-bpim-muted truncate">
            {t("monthlyReview.banner.desc")}
          </p>
        </div>
      </div>
      <Button
        asChild
        size="sm"
        variant="secondary"
        className="shrink-0 text-xs h-7"
      >
        <NextLink href={href}>{t("monthlyReview.banner.button")}</NextLink>
      </Button>
    </div>
  );
};
