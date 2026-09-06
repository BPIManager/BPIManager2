"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Megaphone, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTranslation } from "@/hooks/common/useTranslation";

/** 一度閉じたら再表示しないためのキー。文言を刷新して再告知したくなったら接尾辞を上げる。 */
const DISMISSED_KEY = "bpim2-bpi-change-notice-dismissed-v1";
const DETAIL_URL = "https://x.com/BPIManager/status/2096290042885120037";
const FEEDBACK_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSekqnyJDaGGNbkW3ERKjeBEnqBtxQmVqrzVAopduto35GPZOA/viewform";

/**
 * ダッシュボードに常設する、BPI算出方式の変更検討に関する告知バナー。
 * 閉じるとlocalStorageに記録し、以降は表示しない。
 */
function BpiChangeNotice() {
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
      <Megaphone />
      <AlertTitle>{t("dashboard.bpiChangeNotice.title")}</AlertTitle>
      <AlertDescription>
        <p>{t("dashboard.bpiChangeNotice.desc")}</p>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
          <a
            href={DETAIL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-bpim-primary hover:underline"
          >
            {t("dashboard.bpiChangeNotice.detailLink")}
            <ExternalLink className="h-3 w-3" />
          </a>
          <a
            href={FEEDBACK_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-bpim-primary hover:underline"
          >
            {t("dashboard.bpiChangeNotice.feedbackLink")}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </AlertDescription>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t("dashboard.bpiChangeNotice.dismiss")}
        className="absolute right-2 top-2 rounded-md p-1 text-bpim-muted transition-colors hover:bg-bpim-bg/60 hover:text-bpim-text"
      >
        <X className="h-4 w-4" />
      </button>
    </Alert>
  );
}

export default BpiChangeNotice;
