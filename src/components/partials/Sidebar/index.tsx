"use client";

import { ButtonHTMLAttributes, JSX, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  FileUp,
  Settings,
  ListIcon,
  ChartNoAxesGantt,
  ChartArea,
  UsersIcon,
  ScrollText,
  ChevronRight,
  ChevronDown,
  Search,
  Code2,
  HelpCircle,
  FileClock,
  ExternalLink,
  LayoutDashboard,
  Mail,
  CircleCheck,
  CircleDashed,
  LucideIcon,
  HeartHandshake,
  Trophy,
  Target,
  Music,
  Table,
  Swords,
  BarChart2,
  Ticket,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import { useUser } from "@/contexts/users/UserContext";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/common/useTranslation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { XIcon } from "../LogIn";

export const SidebarContent = ({
  onClose,
  expanded = false,
  pinned = false,
  onTogglePin,
}: {
  onClose?: () => void;
  expanded?: boolean;
  pinned?: boolean;
  onTogglePin?: () => void;
}) => {
  const { user } = useUser();
  const router = useRouter();
  const { t } = useTranslation();
  const [isRivalOpen, setIsRivalOpen] = useState<boolean>(true);
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(true);
  const [isScoreOpen, setIsScoreOpen] = useState<boolean>(true);
  const [isBetaOpen, setIsBetaOpen] = useState<boolean>(true);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState<boolean>(true);

  // Helpers — depend on `expanded` closure
  // Text labels: opacity-0 by default, opacity-1 on hover; when expanded force-show via inline style
  const labelStyle = expanded ? { opacity: 1 } : undefined;
  const labelCn =
    "flex-1 text-left whitespace-nowrap overflow-hidden opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100";

  // display:flex/block elements that are hidden when collapsed
  const showFlex = !expanded ? "hidden group-hover/sidebar:flex" : "";
  const showBlock = !expanded ? "hidden group-hover/sidebar:block" : "";

  // Separator — only shown in expanded mode
  const Sep = () =>
    expanded ? <div className="mx-3 my-0.5 h-px bg-bpim-border/50" /> : null;

  // Section collapsible trigger — hidden when collapsed, shown when expanded
  const SectionTrigger = ({
    isOpen,
    label,
    badge,
    ...props
  }: {
    isOpen: boolean;
    label: string;
    badge?: React.ReactNode;
  } & ButtonHTMLAttributes<HTMLButtonElement>) => (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "w-full justify-start gap-3 px-3 text-bpim-muted hover:bg-bpim-overlay/50 hover:text-bpim-text data-[state=open]:bg-transparent",
        !expanded && "hidden group-hover/sidebar:flex",
      )}
      {...props}
    >
      {isOpen ? (
        <ChevronDown className="h-5 w-5 shrink-0" />
      ) : (
        <ChevronRight className="h-5 w-5 shrink-0" />
      )}
      <span className="text-xs font-bold tracking-wider">{label}</span>
      {badge}
    </Button>
  );

  const rivalMenuItems = [
    { label: t("nav.rivals"), icon: UsersIcon, href: "/rivals", exact: true },
    { label: t("nav.timeline"), icon: ChartNoAxesGantt, href: "/timeline" },
    { label: t("nav.findRivals"), icon: Search, href: "/rivals/search" },
    { label: t("nav.globalRanking"), icon: Trophy, href: "/ranking/global" },
  ];

  const analyticsMenuItems = [
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

  const betaMenuItems = [
    { label: t("nav.assistant"), icon: Target, href: "/optimizer" },
    { label: t("nav.songs"), icon: Music, href: "/songs" },
    {
      label: t("nav.allSongs"),
      icon: ListIcon,
      href: `/my/all/${latestVersion}`,
    },
    { label: t("nav.tickets"), icon: Ticket, href: "/tickets" },
  ];

  const infoMenuItems = [
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

  const renderMenuItem = (
    item: {
      label: string;
      icon: LucideIcon | ((props: { className?: string }) => JSX.Element);
      href: string;
      exact?: boolean;
      isExternal?: boolean;
      isComingSoon?: boolean;
      isBeta?: boolean;
    },
    isNested = false,
  ) => {
    const isActive =
      !item.isExternal &&
      (item.href === "/" || item.exact
        ? router.asPath === item.href
        : router.asPath === item.href ||
          router.asPath.startsWith(item.href + "/") ||
          router.asPath.startsWith(item.href + "?"));

    const content = (
      <div className="flex w-full items-center gap-3">
        <item.icon className="h-5 w-5 shrink-0" />
        <span className={labelCn} style={labelStyle}>
          {item.label}
        </span>
        {item.isBeta && (
          <Badge
            variant="secondary"
            className={cn(
              "text-[9px] px-1.5 py-0 bg-blue-500/10 text-blue-400 border-blue-500/20 font-bold tracking-tighter",
              showFlex,
            )}
          >
            BETA
          </Badge>
        )}
        {item.isComingSoon && (
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] py-0 border-bpim-border text-bpim-muted",
              showFlex,
            )}
          >
            {t("common.comingSoon")}
          </Badge>
        )}
        {item.isExternal && (
          <ExternalLink
            className={cn("h-3 w-3 shrink-0 opacity-40", showBlock)}
          />
        )}
      </div>
    );

    return (
      <Button
        key={item.href}
        asChild
        variant={isActive ? "secondary" : "ghost"}
        size="sm"
        className={cn(
          "w-full justify-start px-3 transition-all",
          isNested
            ? expanded
              ? "pl-9"
              : "pl-3 group-hover/sidebar:pl-9"
            : "pl-3",
          isActive
            ? "bg-bpim-overlay/60 font-bold"
            : "font-medium text-bpim-text",
          item.isComingSoon && "opacity-50 cursor-not-allowed",
        )}
        onClick={item.isComingSoon ? undefined : onClose}
      >
        {item.isComingSoon ? (
          content
        ) : item.isExternal ? (
          <a href={item.href} target="_blank" rel="noopener noreferrer">
            {content}
          </a>
        ) : (
          <Link href={item.href}>{content}</Link>
        )}
      </Button>
    );
  };

  const renderScoreSubItem = (item: {
    label: string;
    icon: LucideIcon;
    href: string;
  }) => {
    const isActive =
      router.asPath === item.href ||
      router.asPath.startsWith(item.href + "/") ||
      router.asPath.startsWith(item.href + "?");

    return (
      <Button
        key={item.href}
        asChild
        variant={isActive ? "secondary" : "ghost"}
        size="sm"
        className={cn(
          "w-full justify-start transition-all",
          expanded ? "pl-9" : "pl-3 group-hover/sidebar:pl-9",
          isActive
            ? "bg-bpim-overlay/60 font-bold"
            : "font-medium text-bpim-text",
        )}
        onClick={onClose}
      >
        <Link href={item.href}>
          <div className="flex w-full items-center gap-3">
            <item.icon className="h-5 w-5 shrink-0" />
            <span className={labelCn} style={labelStyle}>
              {item.label}
            </span>
          </div>
        </Link>
      </Button>
    );
  };

  const scoreSubItems = [
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

  return (
    <div className="flex h-full flex-col gap-1 overflow-y-auto scrollbar-hide py-2 px-2">
      {/* Support */}
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="mb-1 w-full justify-start px-3 font-bold text-pink-400 hover:bg-pink-400/10 hover:text-pink-300 border border-pink-400/20 bg-pink-600/10"
        onClick={onClose}
      >
        <Link href="/support">
          <div className="flex w-full items-center gap-3">
            <HeartHandshake className="h-5 w-5 shrink-0" />
            <span className={labelCn} style={labelStyle}>
              {t("nav.support")}
            </span>
          </div>
        </Link>
      </Button>

      {/* Nav items */}
      <nav className="flex flex-1 flex-col gap-1">
        {renderMenuItem({
          label: t("nav.dashboard"),
          icon: LayoutDashboard,
          href: "/",
        })}
        {renderMenuItem({
          label: t("nav.import"),
          icon: FileUp,
          href: "/import",
        })}

        <Sep />

        <Collapsible
          open={isScoreOpen}
          onOpenChange={setIsScoreOpen}
          className="w-full"
        >
          <CollapsibleTrigger asChild>
            <SectionTrigger
              isOpen={isScoreOpen}
              label={t("nav.section.score")}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-1 mt-1">
            {scoreSubItems.map((item) => renderScoreSubItem(item))}
          </CollapsibleContent>
        </Collapsible>

        {renderMenuItem({
          label: t("nav.scoreLog"),
          icon: ScrollText,
          href: `/users/${user?.userId}/logs/${latestVersion}`,
        })}

        <Sep />

        <Collapsible
          open={isRivalOpen}
          onOpenChange={setIsRivalOpen}
          className="w-full"
        >
          <CollapsibleTrigger asChild>
            <SectionTrigger
              isOpen={isRivalOpen}
              label={t("nav.section.rivals")}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-1 mt-1">
            {rivalMenuItems.map((item) => renderMenuItem(item, true))}
          </CollapsibleContent>
        </Collapsible>

        <Sep />

        <Collapsible
          open={isAnalyticsOpen}
          onOpenChange={setIsAnalyticsOpen}
          className="w-full"
        >
          <CollapsibleTrigger asChild>
            <SectionTrigger
              isOpen={isAnalyticsOpen}
              label={t("nav.section.analytics")}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-1 mt-1">
            {analyticsMenuItems.map((item) => renderMenuItem(item, true))}
          </CollapsibleContent>
        </Collapsible>

        <Sep />

        <Collapsible
          open={isBetaOpen}
          onOpenChange={setIsBetaOpen}
          className="w-full"
        >
          <CollapsibleTrigger asChild>
            <SectionTrigger
              isOpen={isBetaOpen}
              label={t("nav.section.beta")}
              badge={
                <Badge
                  variant="secondary"
                  className="text-[9px] px-1.5 py-0 bg-blue-500/10 text-blue-400 border-blue-500/20 font-bold tracking-tighter"
                >
                  BETA
                </Badge>
              }
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-1 mt-1">
            {betaMenuItems.map((item) => renderMenuItem(item, true))}
          </CollapsibleContent>
        </Collapsible>

        <Sep />

        <Collapsible
          open={isInfoOpen}
          onOpenChange={setIsInfoOpen}
          className="w-full"
        >
          <CollapsibleTrigger asChild>
            <SectionTrigger isOpen={isInfoOpen} label={t("nav.section.info")} />
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-1 mt-1">
            {infoMenuItems.map((item) => renderMenuItem(item, true))}
          </CollapsibleContent>
        </Collapsible>

        <Sep />
        {renderMenuItem({
          label: t("nav.settings"),
          icon: Settings,
          href: "/settings",
        })}
      </nav>

      {/* Pin/unpin toggle — desktop only (only rendered when onTogglePin is provided) */}
      {onTogglePin && (
        <div className="mt-auto border-t border-bpim-border pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start px-3 text-bpim-muted hover:text-bpim-text"
            onClick={onTogglePin}
          >
            <div className="flex w-full items-center gap-3">
              {pinned ? (
                <PanelLeftClose className="h-5 w-5 shrink-0" />
              ) : (
                <PanelLeftOpen className="h-5 w-5 shrink-0" />
              )}
              <span className={labelCn} style={labelStyle}>
                {pinned ? t("nav.sidebar.unpin") : t("nav.sidebar.pin")}
              </span>
            </div>
          </Button>
        </div>
      )}
    </div>
  );
};

export const Github = ({ className }: { className?: string }) => (
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
