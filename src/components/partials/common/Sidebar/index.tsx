"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileUp,
  Settings,
  ScrollText,
  LayoutDashboard,
  HeartHandshake,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import { useUser } from "@/contexts/users/UserContext";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { useTranslation } from "@/hooks/common/useTranslation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SidebarSection from "./Section/ui";
import { MenuItemButton, ScoreSubItemButton } from "./NavButtons/ui";
import {
  getRivalMenuItems,
  getAnalyticsMenuItems,
  getBetaMenuItems,
  getInfoMenuItems,
  getScoreSubItems,
} from "./menuConfig";

// Separator — only shown in expanded mode
const Sep = ({ expanded }: { expanded: boolean }) =>
  expanded ? <div className="mx-3 my-0.5 h-px bg-bpim-border/50" /> : null;

const SidebarContent = ({
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
  const { t } = useTranslation();
  const [isRivalOpen, setIsRivalOpen] = useState<boolean>(true);
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(true);
  const [isScoreOpen, setIsScoreOpen] = useState<boolean>(true);
  const [isBetaOpen, setIsBetaOpen] = useState<boolean>(true);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState<boolean>(true);

  // Text labels: opacity-0 by default, opacity-1 on hover; when expanded force-show via inline style
  const labelStyle = expanded ? { opacity: 1 } : undefined;
  const labelCn =
    "flex-1 text-left whitespace-nowrap overflow-hidden opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100";

  const rivalMenuItems = getRivalMenuItems(t);
  const analyticsMenuItems = getAnalyticsMenuItems(t);
  const betaMenuItems = getBetaMenuItems(t);
  const infoMenuItems = getInfoMenuItems(t);
  const scoreSubItems = getScoreSubItems(t);

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
        <MenuItemButton
          item={{ label: t("nav.dashboard"), icon: LayoutDashboard, href: "/" }}
          expanded={expanded}
          onClose={onClose}
        />
        <MenuItemButton
          item={{ label: t("nav.import"), icon: FileUp, href: "/import" }}
          expanded={expanded}
          onClose={onClose}
        />

        <Sep expanded={expanded} />

        <SidebarSection
          label={t("nav.section.score")}
          isOpen={isScoreOpen}
          onOpenChange={setIsScoreOpen}
          expanded={expanded}
        >
          {scoreSubItems.map((item) => (
            <ScoreSubItemButton
              key={item.href}
              item={item}
              expanded={expanded}
              onClose={onClose}
            />
          ))}
        </SidebarSection>

        <MenuItemButton
          item={{
            label: t("nav.scoreLog"),
            icon: ScrollText,
            href: `/users/${user?.userId}/logs/${latestVersion}`,
          }}
          expanded={expanded}
          onClose={onClose}
        />

        <Sep expanded={expanded} />

        <SidebarSection
          label={t("nav.section.rivals")}
          isOpen={isRivalOpen}
          onOpenChange={setIsRivalOpen}
          expanded={expanded}
        >
          {rivalMenuItems.map((item) => (
            <MenuItemButton
              key={item.href}
              item={item}
              isNested
              expanded={expanded}
              onClose={onClose}
            />
          ))}
        </SidebarSection>

        <Sep expanded={expanded} />

        <SidebarSection
          label={t("nav.section.analytics")}
          isOpen={isAnalyticsOpen}
          onOpenChange={setIsAnalyticsOpen}
          expanded={expanded}
        >
          {analyticsMenuItems.map((item) => (
            <MenuItemButton
              key={item.href}
              item={item}
              isNested
              expanded={expanded}
              onClose={onClose}
            />
          ))}
        </SidebarSection>

        <Sep expanded={expanded} />

        <SidebarSection
          label={t("nav.section.beta")}
          isOpen={isBetaOpen}
          onOpenChange={setIsBetaOpen}
          expanded={expanded}
          badge={
            <Badge
              variant="secondary"
              className="text-[9px] px-1.5 py-0 bg-blue-500/10 text-blue-400 border-blue-500/20 font-bold tracking-tighter"
            >
              BETA
            </Badge>
          }
        >
          {betaMenuItems.map((item) => (
            <MenuItemButton
              key={item.href}
              item={item}
              isNested
              expanded={expanded}
              onClose={onClose}
            />
          ))}
        </SidebarSection>

        <Sep expanded={expanded} />

        <SidebarSection
          label={t("nav.section.info")}
          isOpen={isInfoOpen}
          onOpenChange={setIsInfoOpen}
          expanded={expanded}
        >
          {infoMenuItems.map((item) => (
            <MenuItemButton
              key={item.href}
              item={item}
              isNested
              expanded={expanded}
              onClose={onClose}
            />
          ))}
        </SidebarSection>

        <Sep expanded={expanded} />
        <MenuItemButton
          item={{ label: t("nav.settings"), icon: Settings, href: "/settings" }}
          expanded={expanded}
          onClose={onClose}
        />
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

export default SidebarContent;
