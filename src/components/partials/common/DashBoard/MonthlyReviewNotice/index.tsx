"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTranslation } from "@/hooks/common/useTranslation";

/** 一度閉じたら再表示しないためのキー。文言を刷新して再告知したくなったら接尾辞を上げる。 */
const DISMISSED_KEY = "bpim2-monthly-review-notice-dismissed-v1";
const REVIEW_URL = "/monthly-review/share?version=33&month=all";

/**
 * ダッシュボードに常設する、スパークルシャワー（v33）月間振り返りへの導線バナー。
 * 閉じるとlocalStorageに記録し、以降は表示しない。
 */
function MonthlyReviewNotice() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // localStorageはSSR時に無く、ブロック設定等で例外を投げることもあるため
    // hydration後にクライアントでのみ判定する。読めない場合は表示側に倒す。
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISSED_KEY) !== null;
    } catch {
      dismissed = false;
    }
    if (!dismissed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // 保存できなくても閉じる操作自体は通す
    }
    setVisible(false);
  };

  return (
    <Alert variant="info" className="pr-10">
      <Sparkles />
      <AlertTitle>{t("dashboard.monthlyReviewNotice.title")}</AlertTitle>
      <AlertDescription>
        <Link
          href={REVIEW_URL}
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
