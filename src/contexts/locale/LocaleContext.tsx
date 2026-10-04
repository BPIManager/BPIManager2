"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import type { Locale } from "@/lib/i18n/translations";
import { safeGetItem, safeSetItem } from "@/utils/common/safeStorage";

const STORAGE_KEY = "bpim2-locale";

type LocaleContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextType>({
  locale: "ja",
  setLocale: () => {},
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ja");

  useEffect(() => {
    const saved = safeGetItem(STORAGE_KEY) as Locale | null;
    if (saved === "en" || saved === "ja" || saved === "zh-TW" || saved === "ko") {
      // localStorage は SSR で無いため、hydration 後にのみ読み込んでハイドレーションミスマッチを避ける。
       // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocaleState(saved);
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    safeSetItem(STORAGE_KEY, l);
  }, []);

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export const useLocale = () => useContext(LocaleContext);
