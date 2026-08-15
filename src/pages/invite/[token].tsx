"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useUser } from "@/contexts/users/UserContext";
import DashboardLayout from "@/components/partials/shell/DashboardLayout";
import { PageLoader } from "@/components/ui/loading-spinner";
import { Meta } from "@/components/partials/common/PageChrome/Head";
import { API_PREFIX } from "@/constants/logic/apiEndpoints";
import { authFetch } from "@/utils/common/fetch";
import { useTranslation } from "@/hooks/common/useTranslation";
import FollowInviteContent from "@/components/partials/features/Invite/FollowInvite";

/**
 * 招待URL(`/invite/[token]`)共通ページ。
 *
 * `/api/v1/invite/[token]`が返す`type`によって表示内容を出し分ける
 * （現時点では`"follow"`のみ。チーム招待(#276)等、他の招待種別を
 * 追加する際は同じURL形式のままこのswitchに分岐を追加する）。
 */
type InvitePreviewData = {
  type: "follow";
  userId: string;
  userName: string;
  profileImage: string | null;
  isFollowing: boolean;
  hasPendingRequest: boolean;
};

export default function InvitePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { fbUser, isLoading } = useUser();
  const token = typeof router.query.token === "string" ? router.query.token : null;

  const [preview, setPreview] = useState<InvitePreviewData | null>(null);
  const [lookupFailed, setLookupFailed] = useState(false);

  useEffect(() => {
    // fbUserの認証状態が確定してから取得する(認証ヘッダー付きでisFollowing等を
    // 一緒に取得するため。先に未認証でフェッチすると承認済みでも
    // 「送信」ボタンが一瞬表示されてしまう)
    if (!token || isLoading) return;
    let cancelled = false;
    authFetch(`${API_PREFIX}/invite/${token}`, "GET", fbUser ?? null)
      .then((res) => {
        if (!res.ok) throw new Error("invite lookup failed");
        return res.json();
      })
      .then((data: InvitePreviewData) => {
        if (!cancelled) setPreview(data);
      })
      .catch(() => {
        if (!cancelled) setLookupFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [token, isLoading, fbUser]);

  const content = () => {
    if (!router.isReady || isLoading) {
      return <PageLoader size="lg" />;
    }

    if (lookupFailed) {
      return (
        <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-2 p-6 text-center">
          <p className="text-sm text-bpim-muted">{t("invite.invalid")}</p>
        </div>
      );
    }

    if (!preview) {
      return <PageLoader size="lg" />;
    }

    switch (preview.type) {
      case "follow":
        return <FollowInviteContent token={token!} preview={preview} />;
      default:
        return (
          <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-2 p-6 text-center">
            <p className="text-sm text-bpim-muted">{t("invite.invalid")}</p>
          </div>
        );
    }
  };

  return (
    <DashboardLayout>
      <Meta noIndex title={t("invite.title")} />
      {content()}
    </DashboardLayout>
  );
}
