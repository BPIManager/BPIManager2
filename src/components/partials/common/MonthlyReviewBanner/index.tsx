"use client";

import { useTranslation } from "@/hooks/common/useTranslation";
import { MonthlyReviewBannerUI } from "./ui";

interface Props {
  userId: string;
  month: string;
  version?: string;
}

export const MonthlyReviewBanner = ({ userId, month, version }: Props) => {
  const { t } = useTranslation();
  const href = version
    ? `/users/${userId}/monthly-review/${month}?version=${version}`
    : `/users/${userId}/monthly-review/${month}`;

  return (
    <MonthlyReviewBannerUI
      href={href}
      title={t("monthlyReview.banner.title")}
      desc={t("monthlyReview.banner.desc")}
      buttonLabel={t("monthlyReview.banner.button")}
    />
  );
};
