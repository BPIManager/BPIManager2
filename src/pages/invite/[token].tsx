"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useUser } from "@/contexts/users/UserContext";
import { LoginButtons } from "@/components/partials/common/Auth/Buttons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/loading-spinner";
import { Meta } from "@/components/partials/common/PageChrome/Head";
import { API_PREFIX } from "@/constants/logic/apiEndpoints";
import { authFetch } from "@/utils/common/fetch";
import { useTranslation } from "@/hooks/common/useTranslation";

interface InvitePreview {
  userId: string;
  userName: string;
  profileImage: string | null;
}

type SubmitResult =
  | { status: "requested" | "followed" }
  | { status: "error"; message: string };

export default function InvitePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { fbUser, isLoading } = useUser();
  const token = typeof router.query.token === "string" ? router.query.token : null;

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [lookupFailed, setLookupFailed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch(`${API_PREFIX}/follow-invite/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error("invite lookup failed");
        return res.json();
      })
      .then((data: InvitePreview) => {
        if (!cancelled) setPreview(data);
      })
      .catch(() => {
        if (!cancelled) setLookupFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!router.isReady || isLoading) {
    return <PageLoader size="lg" />;
  }

  if (lookupFailed) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-2 p-6 text-center">
        <Meta noIndex title={t("invite.title")} />
        <p className="text-sm text-bpim-muted">{t("invite.invalid")}</p>
      </div>
    );
  }

  if (!preview) {
    return <PageLoader size="lg" />;
  }

  const isSelf = fbUser?.uid === preview.userId;

  const handleSend = async () => {
    if (!fbUser || !token) return;
    setIsSubmitting(true);
    try {
      const res = await authFetch(
        `${API_PREFIX}/follow-requests`,
        "POST",
        fbUser,
        { token },
      );
      const data = await res.json();
      if (!res.ok) {
        setResult({
          status: "error",
          message: data.message ?? t("invite.failed"),
        });
        return;
      }
      setResult({ status: data.status });
    } catch {
      setResult({ status: "error", message: t("invite.failed") });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-6 p-6">
      <Meta noIndex title={t("invite.title")} />

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
        ) : result?.status === "requested" ? (
          <p className="text-sm text-bpim-success">{t("invite.requested")}</p>
        ) : result?.status === "followed" ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-bpim-success">{t("invite.followed")}</p>
            <Link href={`/users/${preview.userId}`}>
              <Button variant="outline" className="w-full">
                {t("invite.viewProfile")}
              </Button>
            </Link>
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
}
