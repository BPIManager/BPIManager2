"use client";

import { Languages } from "lucide-react";
import { useTranslation } from "@/hooks/common/useTranslation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Locale } from "@/lib/i18n/translations";

export default function LanguageSettingsUi() {
  const { t, locale, setLocale } = useTranslation();

  const options: { value: Locale; label: string }[] = [
    { value: "ja", label: t("settings.language.ja") },
    { value: "en", label: t("settings.language.en") },
    { value: "zh-TW", label: t("settings.language.zh-TW") },
    { value: "ko", label: t("settings.language.ko") },
  ];

  return (
    <div className="mt-4 flex flex-col gap-6 rounded-xl border border-bpim-border bg-bpim-bg p-6 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-bpim-primary">
          <Languages className="h-4 w-4" />
          <span className="font-bold">{t("settings.language.title")}</span>
        </div>
        <p className="text-sm text-bpim-muted">{t("settings.language.desc")}</p>
      </div>
      <Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
