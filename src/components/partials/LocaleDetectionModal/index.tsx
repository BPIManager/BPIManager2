"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/common/useTranslation";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/translations";

const DISMISSED_KEY = "bpim2-locale-modal-dismissed";

const MULTILANG_DESC = [
  { lang: "ja", text: "ご利用の言語をお選びください。" },
  { lang: "en", text: "Please select your language." },
  { lang: "zh", text: "請選擇您偏好的語言。" },
  { lang: "ko", text: "선호하는 언어를 선택해 주세요." },
];

export function LocaleDetectionModal() {
  const { t, setLocale } = useTranslation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) return;

    const primaryLang = navigator.languages?.[0] ?? navigator.language ?? "ja";
    if (!primaryLang.startsWith("ja")) {
      setOpen(true);
    }
  }, []);

  const handleSelect = (locale: Locale) => {
    setLocale(locale);
    setOpen(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setOpen(false);
  };

  const options: { value: Locale; label: string }[] = [
    { value: "ja", label: "日本語" },
    { value: "en", label: "English" },
    { value: "zh-TW", label: "繁體中文" },
    { value: "ko", label: "한국어" },
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleDismiss();
      }}
    >
      <DialogContent className="max-w-md border-bpim-border bg-bpim-bg">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-bpim-text">
            Language
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            {MULTILANG_DESC.map(({ lang, text }) => (
              <p key={lang} className="text-sm text-bpim-text">
                {text}
              </p>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            {options.map((opt) => (
              <Button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={cn(
                  "w-full rounded-lg border font-bold transition-colors",
                  "border-bpim-primary bg-bpim-primary/10 text-bpim-primary hover:bg-bpim-primary/20",
                )}
                variant="ghost"
              >
                {opt.label}
              </Button>
            ))}
          </div>

          <button
            onClick={handleDismiss}
            className="text-center text-[11px] text-bpim-muted hover:text-bpim-text transition-colors"
          >
            {t("common.close")} / {t("settings.language.desc")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
