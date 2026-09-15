"use client";

import { useRouter } from "next/router";
import { useInView } from "@/hooks/common/useInView";
import { useRivalMonthlyReviewSummary } from "@/hooks/social/useRivalMonthlyReviewSummary";
import { useMonthlyReviewMonthlySummary } from "@/hooks/stats/useMonthlyReviewMonthlySummary";
import { useProfile } from "@/hooks/users/useProfile";
import { useUser } from "@/contexts/users/UserContext";
import { useShareDrawer } from "../ShareFab/context";
import FooterSectionUI from "./ui";

interface Props {
  version: string;
}

const FooterSection = ({ version }: Props) => {
  const router = useRouter();
  const [ref, inView] = useInView(0.1);
  const userId = router.query.userId as string | undefined;
  const routeMonth = router.query.month as string | undefined;

  const { rivals, isLoading: rivalsLoading } = useRivalMonthlyReviewSummary({
    userId,
    month: routeMonth,
    version,
  });

  const { data: monthlySummary } = useMonthlyReviewMonthlySummary(userId, version);
  const monthlyLinks = (monthlySummary?.months ?? []).filter(
    (m) => m.month !== routeMonth,
  );

  const { setOpen: setShareOpen } = useShareDrawer();
  // SWRのキャッシュキーがページ本体（[month].tsx）のuseProfile呼び出しと同じため、
  // ここで再度呼んでも追加のfetchは発生しない
  const { profile } = useProfile(userId);
  const { user } = useUser();
  const isOwnProfile = !!user && user.userId === userId;

  return (
    <FooterSectionUI
      inView={inView}
      sectionRef={ref as React.RefObject<HTMLDivElement>}
      onBack={() => router.back()}
      onOpenShare={() => setShareOpen(true)}
      rivals={rivals}
      rivalsLoading={rivalsLoading}
      currentMonth={routeMonth}
      currentVersion={version}
      userId={userId}
      profileUserName={profile?.userName}
      isOwnProfile={isOwnProfile}
      myUserId={user?.userId}
      monthlyLinks={monthlyLinks}
    />
  );
};

export default FooterSection;
