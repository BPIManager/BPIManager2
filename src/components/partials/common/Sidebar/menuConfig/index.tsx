import {
  ListIcon,
  ChartNoAxesGantt,
  ChartArea,
  UsersIcon,
  Search,
  Code2,
  HelpCircle,
  FileClock,
  Mail,
  CircleCheck,
  CircleDashed,
  Trophy,
  Target,
  Music,
  Table,
  Swords,
  BarChart2,
  Ticket,
  LucideIcon,
} from "lucide-react";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import type { TranslationKey } from "@/lib/i18n/translations";
import { XIcon } from "../../../LogIn";

type T = (key: TranslationKey) => string;

/** Sidebarでのみ使う独自GitHubアイコン(lucide-reactに含まれないため) */
const Github = ({ className }: { className?: string }) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="currentColor"
  >
    <title>GitHub</title>
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);

export const getRivalMenuItems = (t: T) => [
  { label: t("nav.rivals"), icon: UsersIcon, href: "/rivals", exact: true },
  { label: t("nav.timeline"), icon: ChartNoAxesGantt, href: "/timeline" },
  { label: t("nav.findRivals"), icon: Search, href: "/rivals/search" },
  { label: t("nav.globalRanking"), icon: Trophy, href: "/ranking/global" },
];

export const getAnalyticsMenuItems = (t: T) => [
  { label: t("nav.compare"), icon: ChartArea, href: "/analytics" },
  {
    label: t("nav.aaaChart"),
    icon: Table,
    href: "/metrics/AAADifficultyTable",
  },
  {
    label: t("nav.arenaAverage"),
    icon: Swords,
    href: `/metrics/arenaAverage/${latestVersion}?difficultyLevel=12`,
  },
];

export const getBetaMenuItems = (t: T) => [
  { label: t("nav.assistant"), icon: Target, href: "/optimizer" },
  { label: t("nav.songs"), icon: Music, href: "/songs" },
  {
    label: t("nav.allSongs"),
    icon: ListIcon,
    href: `/my/all/${latestVersion}`,
  },
  { label: t("nav.tickets"), icon: Ticket, href: "/tickets" },
];

export const getInfoMenuItems = (t: T) => [
  {
    label: t("nav.apiRef"),
    icon: Code2,
    href: "https://bpim2.apidog.io/",
    isExternal: true,
  },
  {
    label: "GitHub",
    icon: Github,
    href: "https://github.com/BPIManager/BPIManager2",
    isExternal: true,
  },
  {
    label: t("nav.help"),
    icon: HelpCircle,
    href: "https://www.notion.so/BPIM2-3239989ca87a809f8058dc9736f0e197",
    isExternal: true,
  },
  {
    label: t("nav.changelog"),
    icon: FileClock,
    href: "https://www.notion.so/BPIM2-3289989ca87a80d08bf7f916b97285e3",
    isExternal: true,
  },
  {
    label: t("nav.reportIssue"),
    icon: Mail,
    href: "https://forms.gle/VfMJpFrKfSJqRYLA8",
    isExternal: true,
  },
  {
    label: t("nav.followOnX"),
    icon: XIcon,
    href: "https://x.com/BPIManager",
    isExternal: true,
  },
  {
    label: t("nav.statistics"),
    icon: BarChart2 as LucideIcon,
    href: "/info/stats",
  },
];

export const getScoreSubItems = (t: T) => [
  {
    label: t("nav.scorePlayed"),
    icon: CircleCheck,
    href: `/my/${latestVersion}?levels=12%2C11&difficulties=LEGGENDARIA%2CHYPER%2CANOTHER`,
  },
  {
    label: t("nav.scoreUnplayed"),
    icon: CircleDashed,
    href: `/my/unplayed/${latestVersion}?levels=12%2C11&difficulties=LEGGENDARIA%2CHYPER%2CANOTHER`,
  },
];
