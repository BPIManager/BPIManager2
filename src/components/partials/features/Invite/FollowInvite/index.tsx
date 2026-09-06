"use client";

import { useState } from "react";
import Link from "next/link";
import { useUser } from "@/contexts/users/UserContext";
import { LoginButtons } from "@/components/partials/common/Auth/Buttons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { authFetch } from "@/utils/common/fetch";
import { useTranslation } from "@/hooks/common/useTranslation";

interface FollowInvitePreview {
  userId: string;
  userName: string;
  profileImage: string | null;
  isFollowing: boolean;
  hasPendingRequest: boolean;
}

type SubmitResult =
  | { status: "requested" | "followed" }
  | { status: "error"; message: string };

/**
 * フォロー招待(`/invite/[token]`、`type: "follow"`)の本文。
 *
 * @param token - 招待URLのトークン
 * @param preview - 招待発行者の表示情報・現在の関係性（承認済み/保留中）
 */
const FollowInviteContent = ({
  token,
  preview,
}: {
  token: string;
  preview: FollowInvitePreview;
}) => {
  const { t } = useTranslation();
  const { fbUser } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(
    preview.isFollowing
      ? { status: "followed" }
      : preview.hasPendingRequest
        ? { status: "requested" }
        : null,
  );

  const isSelf = fbUser?.uid === preview.userId;

  const handleSend = async () => {
    if (!fbUser) return;
    setIsSubmitting(true);
    try {
      const res = await authFetch(
        `${API_V2_PREFIX}/follow-requests`,
        "POST",
        fbUser,
        { token },
      );
      const data = await res.json();
      if (!res.ok || data?.error) {
        setResult({
          status: "error",
          message: data?.errorMessage ?? data?.message ?? t("invite.failed"),
        });
        return;
      }
      setResult({ status: data.body?.status ?? data.status });
    } catch {
      setResult({ status: "error", message: t("invite.failed") });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!fbUser) return;
    setIsSubmitting(true);
    try {
      const res = await authFetch(
        `${API_V2_PREFIX}/follow-requests/${preview.userId}`,
        "DELETE",
        fbUser,
      );
      if (!res.ok) {
        setResult({ status: "error", message: t("invite.failed") });
        return;
      }
      setResult(null);
    } catch {
      setResult({ status: "error", message: t("invite.failed") });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-6 p-6">
      <div className="w-full rounded-2xl border border-bpim-border p-6 text-center">
        <Avatar className="mx-auto mb-3 h-16 w-16 border-2 border-bpim-border">
          <AvatarImage src={preview.profileImage ?? ""} alt={preview.userName} />
          <AvatarFallback>{preview.userName.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <h1 className="mb-2 text-lg font-semibold text-bpim-text">
          {preview.userName}
        </h1>
        <p className="mb-6 text-sm text-bpim-muted">{t("invite.desc")}</p>

        {isSelf ? (
          <p className="text-sm text-bpim-muted">{t("invite.self")}</p>
        ) : !fbUser ? (
          <LoginButtons />
        ) : result?.status === "followed" ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-bpim-success">
              {t("invite.alreadyApproved")}
            </p>
            <Link href={`/users/${preview.userId}`}>
              <Button variant="outline" className="w-full">
                {t("invite.viewProfile")}
              </Button>
            </Link>
          </div>
        ) : result?.status === "requested" ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-bpim-success">{t("invite.requested")}</p>
            <Button
              variant="outline"
              onClick={handleWithdraw}
              disabled={isSubmitting}
            >
              {t("invite.withdraw")}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {result?.status === "error" && (
              <p className="text-sm text-bpim-danger">{result.message}</p>
            )}
            <Button onClick={handleSend} disabled={isSubmitting}>
              {t("invite.send")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowInviteContent;
