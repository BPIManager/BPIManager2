"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Camera, ExternalLink, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTranslation } from "@/hooks/common/useTranslation";
import { BPIM2_CAMERA_URL } from "@/constants/site/camera";

/** 一度閉じたら再表示しないためのキー。文言を刷新して再告知したくなったら接尾辞を上げる。 */
const DISMISSED_KEY = "bpim2-camera-release-notice-dismissed-v1";

/**
 * ダッシュボードの最上部に置く、BPIM2 Camera リリースの告知バナー。
 * 閉じるとlocalStorageに記録し、以降は表示しない。
 */
function CameraReleaseNotice() {
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
      <Camera />
      <AlertTitle>{t("dashboard.cameraReleaseNotice.title")}</AlertTitle>
      <AlertDescription>
        <p>{t("dashboard.cameraReleaseNotice.desc")}</p>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
          <a
            href={BPIM2_CAMERA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-bpim-primary hover:underline"
          >
            {t("dashboard.cameraReleaseNotice.openLink")}
            <ExternalLink className="h-3 w-3" />
          </a>
          <Link
            href="/import"
            className="inline-flex items-center gap-1 font-medium text-bpim-primary hover:underline"
          >
            {t("dashboard.cameraReleaseNotice.importLink")}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </AlertDescription>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t("dashboard.cameraReleaseNotice.dismiss")}
        className="absolute right-2 top-2 rounded-md p-1 text-bpim-muted transition-colors hover:bg-bpim-bg/60 hover:text-bpim-text"
      >
        <X className="h-4 w-4" />
      </button>
    </Alert>
  );
}

export default CameraReleaseNotice;
