"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";
import { useUser } from "@/contexts/users/UserContext";
import { LoginRequiredCard } from "@/components/partials/common/Auth/LoginRequired/ui";
import { PageLoader } from "@/components/ui/loading-spinner";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import dayjs from "@/lib/dayjs";

/**
 * userIdを含まない告知用の汎用URL（/monthly-review/share）の実体。
 * ログイン中セッションからuserIdを読み取り、本人の「先月のまとめ」ページへ
 * 自動遷移する。サーバーサイドセッション読み取り機構が本リポジトリに無い
 * ため、クライアントコンポーネントとして実装する。
 */
const MonthlyReviewShare = () => {
  const router = useRouter();
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (!user) return;
    const defaultMonth = dayjs.tz().subtract(1, "month").format("YYYY-MM");
    router.replace(
      `/users/${user.userId}/monthly-review/${defaultMonth}?version=${latestVersion}`,
    );
  }, [user, router]);

  if (isLoading || user) {
    return <PageLoader />;
  }

  return <LoginRequiredCard />;
};

export default MonthlyReviewShare;
