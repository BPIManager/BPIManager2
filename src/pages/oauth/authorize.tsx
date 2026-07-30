"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import { useUser } from "@/contexts/users/UserContext";
import { LoginButtons } from "@/components/partials/common/Auth/Buttons";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/loading-spinner";
import { Meta } from "@/components/partials/common/PageChrome/Head";

function getStringParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

export default function OAuthAuthorizePage() {
  const router = useRouter();
  const { fbUser, isLoading } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientId = getStringParam(router.query.client_id);
  const redirectUri = getStringParam(router.query.redirect_uri);
  const codeChallenge = getStringParam(router.query.code_challenge);
  const codeChallengeMethod = getStringParam(
    router.query.code_challenge_method,
  );
  const state = getStringParam(router.query.state);
  const responseType = getStringParam(router.query.response_type);

  const paramsAreValid =
    !!clientId &&
    !!redirectUri &&
    !!codeChallenge &&
    codeChallengeMethod === "S256" &&
    (!responseType || responseType === "code");

  if (isLoading || !router.isReady) {
    return <PageLoader size="lg" />;
  }

  if (!paramsAreValid) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-2 p-6 text-center">
        <Meta noIndex title="接続の許可" />
        <p className="text-sm text-bpim-muted">
          リクエストされた接続情報が不正です。接続元のアプリケーションから
          やり直してください。
        </p>
      </div>
    );
  }

  const handleDeny = () => {
    const url = new URL(redirectUri!);
    url.searchParams.set("error", "access_denied");
    if (state) url.searchParams.set("state", state);
    window.location.href = url.toString();
  };

  const handleAllow = async () => {
    if (!fbUser) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const idToken = await fbUser.getIdToken();

      const res = await fetch("/api/oauth/consent", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          redirect_uri: redirectUri,
          code_challenge: codeChallenge,
          code_challenge_method: codeChallengeMethod,
          state,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "許可処理に失敗しました。");
        setIsSubmitting(false);
        return;
      }

      window.location.href = data.redirectUrl;
    } catch {
      setError("許可処理に失敗しました。");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-6 p-6">
      <Meta noIndex title="接続の許可" />

      <div className="w-full rounded-2xl border border-bpim-border p-6 text-center">
        <h1 className="mb-2 text-lg font-semibold text-bpim-text">
          外部アプリケーションからの接続
        </h1>
        <p className="mb-6 text-sm text-bpim-muted">
          外部アプリケーションが、あなたのBPIM2データの読み取りを
          リクエストしています。許可すると、そのアプリケーションはあなた自身の
          スコア情報を取得できるようになります。
        </p>

        {!fbUser ? (
          <LoginButtons />
        ) : (
          <div className="flex flex-col gap-3">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={handleAllow} disabled={isSubmitting}>
              許可する
            </Button>
            <Button
              variant="outline"
              onClick={handleDeny}
              disabled={isSubmitting}
            >
              拒否する
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
