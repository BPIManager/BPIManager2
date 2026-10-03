"use client";

import { useEffect, useRef } from "react";

const SCRIPT_ID = "cf-turnstile-script";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileApi {
  render: (
    el: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => string;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Turnstile script failed to load"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

interface Props {
  /** 検証成功時はトークン、期限切れ・エラー時は空文字を渡す */
  onVerify: (token: string) => void;
}

/**
 * Cloudflare Turnstile のウィジェット。トークンは使い捨てのため、再送時は呼び出し側が key を変えて再描画する。
 * 検証はサーバー側（siteverify）で行うため、ここで得たトークンを信用してはいけない。
 */
export default function Turnstile({ onVerify }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onVerifyRef = useRef(onVerify);

  useEffect(() => {
    onVerifyRef.current = onVerify;
  }, [onVerify]);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey) return;

    let widgetId: string | null = null;
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetId = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => onVerifyRef.current(token),
          "expired-callback": () => onVerifyRef.current(""),
          "error-callback": () => onVerifyRef.current(""),
        });
      })
      .catch(() => onVerifyRef.current(""));

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, []);

  return <div ref={containerRef} />;
}
