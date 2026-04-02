"use client";

import { JSX, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  FileUp,
  Settings,
  LogOut,
  ListIcon,
  ChartNoAxesGantt,
  LandPlot,
  ChartArea,
  StickyNote,
  UsersIcon,
  ScrollText,
  User,
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
} from "lucide-react";

import { useUser } from "@/contexts/users/UserContext";
import { authActions } from "@/lib/firebase/auth";
import { latestVersion } from "@/constants/latestVersion";
import { cn } from "@/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { XIcon } from "../LogIn";
import { RoleBadge } from "../UserRole/badge";

export const SidebarContent = ({ onClose }: { onClose?: () => void }) => {
  const { user } = useUser();
  const router = useRouter();
  const [isRivalOpen, setIsRivalOpen] = useState<boolean>(true);
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(true);
  const [isScoreOpen, setIsScoreOpen] = useState<boolean>(true);

  const rivalMenuItems = [
    { label: "ライバル一覧", icon: UsersIcon, href: "/rivals", exact: true },
    { label: "タイムライン", icon: ChartNoAxesGantt, href: "/timeline" },
    { label: "ライバルを探す", icon: Search, href: "/rivals/search" },
    { label: "全体ランキング", icon: Trophy, href: "/ranking/global" },
  ];

  const otherMenuItems = [
    {
      label: "アシスタント",
      icon: Target,
      href: "/optimizer",
      isBeta: true,
    },
    { label: "比較", icon: ChartArea, href: "/analytics" },
    { label: "メモ", icon: StickyNote, href: "/notes", isComingSoon: true },
    { label: "指標", icon: LandPlot, href: "/metrics" },
    {
      label: "全曲（☆10以下含む）",
      icon: ListIcon,
      href: `/my/all/${latestVersion}`,
    },
    { label: "設定", icon: Settings, href: "/settings" },
  ];

  const infoMenuItems = [
    {
      label: "ご寄付のお願い",
      icon: HeartHandshake,
      href: "https://ci-en.net/creator/36005",
      isExternal: true,
    },
    {
      label: "APIリファレンス",
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
      label: "ヘルプページ",
      icon: HelpCircle,
      href: "https://www.notion.so/BPIM2-3239989ca87a809f8058dc9736f0e197",
      isExternal: true,
    },
    {
      label: "更新履歴",
      icon: FileClock,
      href: "https://www.notion.so/BPIM2-3289989ca87a80d08bf7f916b97285e3",
      isExternal: true,
    },
    {
      label: "不具合・要望の報告",
      icon: Mail,
      href: "https://forms.gle/VfMJpFrKfSJqRYLA8",
      isExternal: true,
    },
    {
      label: "Xでフォロー",
      icon: XIcon,
      href: "https://x.com/BPIManager",
      isExternal: true,
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
        <item.icon className="h-4.5 w-4.5" />
        <span className="flex-1 text-left">{item.label}</span>
        {item.isBeta && (
          <Badge
            variant="secondary"
            className="text-[9px] px-1.5 py-0 bg-blue-500/10 text-blue-400 border-blue-500/20 font-bold tracking-tighter"
          >
            BETA
          </Badge>
        )}
        {item.isComingSoon && (
          <Badge
            variant="outline"
            className="text-[10px] py-0 border-bpim-border text-bpim-muted"
          >
            近日公開
          </Badge>
        )}
        {item.isExternal && <ExternalLink className="h-3 w-3 opacity-40" />}
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
          isNested ? "pl-9" : "pl-3",
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
          "w-full justify-start pl-9 transition-all",
          isActive
            ? "bg-bpim-overlay/60 font-bold"
            : "font-medium text-bpim-text",
        )}
        onClick={onClose}
      >
        <Link href={item.href}>
          <div className="flex w-full items-center gap-3">
            <item.icon className="h-4 w-4" />
            <span className="flex-1 text-left">{item.label}</span>
          </div>
        </Link>
      </Button>
    );
  };

  const scoreSubItems = [
    {
      label: "プレイ済み",
      icon: CircleCheck,
      href: `/my/${latestVersion}?levels=12%2C11&difficulties=LEGGENDARIA%2CHYPER%2CANOTHER`,
    },
    {
      label: "未プレイ",
      icon: CircleDashed,
      href: `/my/unplayed/${latestVersion}?levels=12%2C11&difficulties=LEGGENDARIA%2CHYPER%2CANOTHER`,
    },
  ];

  return (
    <div className="flex h-full flex-col gap-6 p-4 overflow-y-auto scrollbar-hide">
      <div className="rounded-xl border border-bpim-border bg-bpim-surface-2/60 p-4 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Link href={`/users/${user?.userId}`} onClick={onClose}>
            <Avatar className="h-12 w-12">
              <AvatarImage
                src={user?.profileImage || ""}
                alt={user?.userName || "User"}
              />
              <AvatarFallback className="bg-bpim-surface-2 text-bpim-muted">
                {user?.userName?.slice(0, 2) || "U"}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-bpim-text">
              {user?.userName || "Guest"}
            </p>
            <p className="truncate font-mono text-[10px] text-bpim-muted">
              {user?.iidxId ? `ID: ${user.iidxId}` : "ID未設定"}
            </p>
            <p className="font-mono text-[10px] font-bold text-bpim-warning">
              ☆12 BPI: {user?.totalBpi ?? -15}
            </p>
            {user?.role && (
              <RoleBadge {...user.role} variant="full" size="small" />
            )}
          </div>
        </div>

        {user?.userId && (
          <div className="flex flex-col gap-3">
            <Button
              asChild
              variant="outline"
              size="xs"
              className="w-full justify-between border-slate-700 h-7 px-2 hover:bg-bpim-overlay/50"
              onClick={onClose}
            >
              <Link href={`/users/${user?.userId}`}>
                <div className="flex items-center gap-1.5">
                  <User className="h-3 w-3" />
                  <span className="text-[10px]">プロフィールを表示</span>
                </div>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </Button>

            <div className="flex justify-center gap-8 px-1">
              <Link
                href={`/users/${user?.userId}/following`}
                onClick={onClose}
                className="text-center group"
              >
                <p className="text-xs font-bold text-bpim-text">
                  {user?.followingCount ?? 0}
                </p>
                <p className="text-[10px] text-bpim-muted group-hover:text-bpim-text">
                  フォロー
                </p>
              </Link>
              <Link
                href={`/users/${user?.userId}/followers`}
                onClick={onClose}
                className="text-center group"
              >
                <p className="text-xs font-bold text-bpim-text">
                  {user?.followerCount ?? 0}
                </p>
                <p className="text-[10px] text-bpim-muted group-hover:text-bpim-text">
                  フォロワー
                </p>
              </Link>
            </div>
          </div>
        )}
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {renderMenuItem({
          label: "ダッシュボード",
          icon: LayoutDashboard,
          href: "/",
        })}
        {renderMenuItem({ label: "インポート", icon: FileUp, href: "/import" })}

        <Collapsible
          open={isScoreOpen}
          onOpenChange={setIsScoreOpen}
          className="w-full"
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-3 px-3 text-bpim-muted hover:bg-bpim-overlay/50 hover:text-bpim-text data-[state=open]:bg-transparent"
            >
              {isInfoOpen ? (
                <ChevronDown className="h-4.5 w-4.5" />
              ) : (
                <ChevronRight className="h-4.5 w-4.5" />
              )}
              <span className="text-xs font-bold tracking-wider">
                スコア一覧
              </span>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-1 mt-1">
            {scoreSubItems.map((item) => renderScoreSubItem(item))}
          </CollapsibleContent>
        </Collapsible>

        {renderMenuItem({
          label: "スコア更新ログ",
          icon: ScrollText,
          href: `/users/${user?.userId}/logs/${latestVersion}`,
        })}

        <Collapsible
          open={isRivalOpen}
          onOpenChange={setIsRivalOpen}
          className="w-full"
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-3 px-3 text-bpim-muted hover:bg-bpim-overlay/50 hover:text-bpim-text data-[state=open]:bg-transparent"
            >
              {isRivalOpen ? (
                <ChevronDown className="h-4.5 w-4.5" />
              ) : (
                <ChevronRight className="h-4.5 w-4.5" />
              )}
              <span className="text-xs font-bold tracking-wider">ライバル</span>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-1 mt-1">
            {rivalMenuItems.map((item) => renderMenuItem(item, true))}
          </CollapsibleContent>
        </Collapsible>

        {otherMenuItems.map((item) => renderMenuItem(item))}

        <Collapsible
          open={isInfoOpen}
          onOpenChange={setIsInfoOpen}
          className="w-full"
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-3 px-3 text-bpim-muted hover:bg-bpim-overlay/50 hover:text-bpim-text data-[state=open]:bg-transparent"
            >
              {isInfoOpen ? (
                <ChevronDown className="h-4.5 w-4.5" />
              ) : (
                <ChevronRight className="h-4.5 w-4.5" />
              )}
              <span className="text-xs font-bold tracking-wider">関連情報</span>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-1 mt-1">
            {infoMenuItems.map((item) => renderMenuItem(item, true))}
          </CollapsibleContent>
        </Collapsible>
      </nav>

      <div className="flex flex-col gap-4 pt-4 mt-auto">
        {user?.userId && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center gap-2 text-bpim-danger hover:bg-bpim-danger/10 hover:text-bpim-danger"
            onClick={() => authActions.logout()}
          >
            <LogOut className="h-4 w-4" />
            <span className="font-bold text-xs">サインアウト</span>
          </Button>
        )}
      </div>
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
