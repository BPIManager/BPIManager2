import { commonTranslations } from "./locales/common";
import { navTranslations } from "./locales/nav";
import { pagesTranslations } from "./locales/pages";
import { settingsTranslations } from "./locales/settings";
import { dashboardTranslations } from "./locales/dashboard";
import { analyticsTranslations } from "./locales/analytics";
import { authTranslations } from "./locales/auth";
import { roleTranslations } from "./locales/role";
import { importTranslations } from "./locales/import";
import { rankingTranslations } from "./locales/ranking";
import { rivalsTranslations } from "./locales/rivals";
import { timelineTranslations } from "./locales/timeline";
import { notificationsTranslations } from "./locales/notifications";
import { logsTranslations } from "./locales/logs";
import { ticketsTranslations } from "./locales/tickets";
import { shareTranslations } from "./locales/share";
import { loginPageTranslations } from "./locales/login";
import { monthlyReviewTranslations } from "./locales/monthlyReview";

export type Locale = "ja" | "en" | "zh-TW" | "ko";

export const translations = {
  ...commonTranslations,
  ...navTranslations,
  ...pagesTranslations,
  ...settingsTranslations,
  ...dashboardTranslations,
  ...analyticsTranslations,
  ...authTranslations,
  ...roleTranslations,
  ...importTranslations,
  ...rankingTranslations,
  ...rivalsTranslations,
  ...timelineTranslations,
  ...notificationsTranslations,
  ...logsTranslations,
  ...ticketsTranslations,
  ...shareTranslations,
  ...loginPageTranslations,
  ...monthlyReviewTranslations,
} as const;

export type TranslationKey = keyof typeof translations;
