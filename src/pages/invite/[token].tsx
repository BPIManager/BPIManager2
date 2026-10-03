"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useUser } from "@/contexts/users/UserContext";
import DashboardLayout from "@/components/partials/shell/DashboardLayout";
import { PageLoader } from "@/components/ui/loading-spinner";
import { Meta } from "@/components/partials/common/PageChrome/Head";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { authFetch } from "@/utils/common/fetch";
import { unwrapApiResponse } from "@/services/swr/fetchV2";
import { useTranslation } from "@/hooks/common/useTranslation";
import FollowInviteContent from "@/components/partials/features/Invite/FollowInvite";

/**
 * 招待URL（/invite/[token]）の共通ページ。API の type によって表示を出し分ける（現時点では follow のみ）。
 * 他の招待種別を追加する場合は、同じ URL 形式のまま switch に分岐を足す。
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
    // fbUser の認証確定後に取得する（認証ヘッダー付きで isFollowing 等を取るため）。未認証で先に取ると承認済みでも「送信」が一瞬出る。
    if (!token || isLoading) return;
    let cancelled = false;
    authFetch(`${API_V2_PREFIX}/invite/${token}`, "GET", fbUser ?? null)
      .then((res) => {
        if (!res.ok) throw new Error("invite lookup failed");
        return unwrapApiResponse<InvitePreviewData>(res);
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
