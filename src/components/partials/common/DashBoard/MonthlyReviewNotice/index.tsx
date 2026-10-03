"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTranslation } from "@/hooks/common/useTranslation";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import dayjs from "@/lib/dayjs";

/** 一度閉じたら対象月の間は再表示しないためのキープレフィックス。月ごとに対象期間が変わるため末尾に対象月を付与する。 */
const DISMISSED_KEY_PREFIX = "bpim2-monthly-review-notice-dismissed-v1";

/**
 * ダッシュボード常設の先月分の月間振り返り導線。対象月は動的に先月を指し、閉じると localStorage に記録して同月中は再表示しない。
 */
function MonthlyReviewNotice() {
  const { t, tFormat } = useTranslation();
  const [visible, setVisible] = useState(false);

  const lastMonth = dayjs.tz().subtract(1, "month");
  const targetMonth = lastMonth.format("YYYY-MM");
  const reviewUrl = `/monthly-review/share?version=${latestVersion}&month=${targetMonth}`;
  const dismissedKey = `${DISMISSED_KEY_PREFIX}-${targetMonth}`;

  useEffect(() => {
    // localStorageはSSR時に無く、ブロック設定等で例外を投げることもあるため
    // hydration後にクライアントでのみ判定する。読めない場合は表示側に倒す。
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(dismissedKey) !== null;
    } catch {
      dismissed = false;
    }
    if (!dismissed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
    }
  }, [dismissedKey]);

  if (!visible) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(dismissedKey, "1");
    } catch {
      // 保存できなくても閉じる操作自体は通す
    }
    setVisible(false);
  };

  return (
    <Alert variant="info" className="pr-10">
      <Sparkles />
      <AlertTitle>
        {tFormat("dashboard.monthlyReviewNotice.title", {
          year: lastMonth.format("YYYY"),
          month: lastMonth.format("M"),
        })}
      </AlertTitle>
      <AlertDescription>
        <Link
          href={reviewUrl}
          className="inline-flex items-center gap-1 font-medium text-bpim-primary hover:underline"
        >
          {t("dashboard.monthlyReviewNotice.linkText")}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </AlertDescription>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t("dashboard.monthlyReviewNotice.dismiss")}
        className="absolute right-2 top-2 rounded-md p-1 text-bpim-muted transition-colors hover:bg-bpim-bg/60 hover:text-bpim-text"
      >
        <X className="h-4 w-4" />
      </button>
    </Alert>
  );
}

export default MonthlyReviewNotice;
