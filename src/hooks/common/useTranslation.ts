import { useLocale } from "@/contexts/locale/LocaleContext";
import { translations, type TranslationKey } from "@/lib/i18n/translations";

export function useTranslation() {
  const { locale, setLocale } = useLocale();

  const t = (key: TranslationKey): string => translations[key][locale];

  const tFormat = (key: TranslationKey, params: Record<string, string | number>): string => {
    let str: string = translations[key][locale];
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(`{${k}}`, String(v));
    }
    return str;
  };

  return { t, tFormat, locale, setLocale };
}
