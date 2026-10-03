"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";
import { useUser } from "@/contexts/users/UserContext";
import { LoginRequiredCard } from "@/components/partials/common/Auth/LoginRequired/ui";
import { PageLoader } from "@/components/ui/loading-spinner";
import { IIDX_VERSIONS, latestVersion } from "@/constants/iidx/iidxVersions";
import dayjs from "@/lib/dayjs";

// [month]ルートが受け付ける形式（YYYY-MM / YYYY / all）と同じ判定
const isValidPeriod = (value: string) =>
  value === "all" || /^\d{4}$/.test(value) || /^\d{4}-\d{2}$/.test(value);

/**
 * userId を含まない告知用URL（/monthly-review/share）の実体。ログイン中セッションの本人のまとめページへ自動遷移する。
 * version・month（range はエイリアス）のクエリがあればそれを遷移先に反映し、無ければ最新バージョン・先月を既定とする。
 */
const MonthlyReviewShare = () => {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const rawVersion = router.query.version;
  const rawPeriod = router.query.month ?? router.query.range;

  useEffect(() => {
    if (!user || !router.isReady) return;
    const version =
      typeof rawVersion === "string" &&
      (IIDX_VERSIONS as readonly string[]).includes(rawVersion)
        ? rawVersion
        : latestVersion;
    const period =
      typeof rawPeriod === "string" && isValidPeriod(rawPeriod)
        ? rawPeriod
        : dayjs.tz().subtract(1, "month").format("YYYY-MM");
    router.replace(
      `/users/${user.userId}/monthly-review/${period}?version=${version}`,
    );
  }, [user, router, router.isReady, rawVersion, rawPeriod]);

  if (isLoading || user) {
    return <PageLoader />;
  }

  return <LoginRequiredCard />;
};

export default MonthlyReviewShare;
