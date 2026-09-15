"use client";

import { useInView } from "@/hooks/common/useInView";
import { useTranslation } from "@/hooks/common/useTranslation";
import { useProfile } from "@/hooks/users/useProfile";
import dayjs from "@/lib/dayjs";
import { getVersionNameFromNumber } from "@/constants/iidx/versionTitles";
import { useRouter } from "next/router";
import TitleSectionUI from "./ui";

interface Props {
  month: string;
  version: string;
  bpiDiff: number | undefined;
  granularity: "month" | "year" | "version";
}

const TitleSection = ({ month, version, bpiDiff, granularity }: Props) => {
  const [ref, inView] = useInView(0.1);
  const { t } = useTranslation();
  const router = useRouter();
  const userId = router.query.userId as string | undefined;

  const { profile } = useProfile(userId);

  const isYearMode = granularity === "year";
  const isAllMode = granularity === "version";

  const periodLabel = isAllMode
    ? version === "INF"
      ? "INFINITAS"
      : `IIDX ${getVersionNameFromNumber(version)}`
    : isYearMode
      ? dayjs.tz(`${month}-01-01`).format("YYYY年")
      : dayjs.tz(`${month}-01`).format("YYYY年M月");

  const diffColor =
    bpiDiff === undefined ? "rgba(255,255,255,0.4)" : bpiDiff >= 0 ? "#34d399" : "#f87171";
  const subtitle = isAllMode
    ? t("monthlyReview.subtitle.version")
    : isYearMode
      ? t("monthlyReview.subtitle.year")
      : t("monthlyReview.subtitle.month");

  return (
    <TitleSectionUI
      periodLabel={periodLabel}
      compact={isAllMode}
      diffColor={diffColor}
      subtitle={subtitle}
      inView={inView}
      sectionRef={ref as React.RefObject<HTMLDivElement>}
      userId={userId}
      userName={profile?.userName ?? null}
      profileImage={profile?.profileImage ?? null}
    />
  );
};

export default TitleSection;
