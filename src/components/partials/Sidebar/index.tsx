"use client";

import { useState } from "react";
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
  Github,
  User,
  ChevronRight,
  ChevronDown,
  Search,
  Code2,
} from "lucide-react";
import { LuLayoutDashboard } from "react-icons/lu";

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

export const SidebarContent = ({ onClose }: { onClose?: () => void }) => {
  const { user } = useUser();
  const router = useRouter();
  const [isRivalOpen, setIsRivalOpen] = useState<boolean>(true);

  const mainMenuItems = [
    { label: "ダッシュボード", icon: LuLayoutDashboard, href: "/" },
    { label: "インポート", icon: FileUp, href: "/import" },
    { label: "スコア一覧", icon: ListIcon, href: "/my" },
    {
      label: "スコア更新ログ",
      icon: ScrollText,
      href: `/users/${user?.userId}/logs/${latestVersion}`,
    },
  ];

  const rivalMenuItems = [
    { label: "ライバル一覧", icon: UsersIcon, href: "/rivals", exact: true },
    { label: "タイムライン", icon: ChartNoAxesGantt, href: "/timeline" },
    { label: "ライバルを探す", icon: Search, href: "/rivals/search" },
  ];

  const otherMenuItems = [
    { label: "分析", icon: ChartArea, href: "/analytics", isComingSoon: true },
    { label: "メモ", icon: StickyNote, href: "/notes", isComingSoon: true },
    { label: "指標", icon: LandPlot, href: "/metrics" },
    { label: "設定", icon: Settings, href: "/settings" },
  ];

  const renderMenuItem = (item: any, isNested = false) => {
    const isActive =
      item.href === "/" || item.exact
        ? router.asPath === item.href
        : router.asPath === item.href ||
          router.asPath.startsWith(item.href + "/") ||
          router.asPath.startsWith(item.href + "?");

    return (
      <Button
        key={item.href}
        asChild
        variant={isActive ? "secondary" : "ghost"}
        size="sm"
        className={cn(
          "w-full justify-start gap-3 px-3 transition-all",
          isNested ? "pl-9" : "pl-3",
          isActive ? "bg-white/10 font-bold" : "font-medium text-slate-300",
          item.isComingSoon && "opacity-50 cursor-not-allowed",
        )}
        onClick={item.isComingSoon ? undefined : onClose}
      >
        {item.isComingSoon ? (
          <div className="flex w-full items-center gap-3">
            <item.icon className="h-4.5 w-4.5" />
            <span>{item.label}</span>
            <Badge
              variant="outline"
              className="ml-auto text-[10px] py-0 border-bpim-border text-slate-500"
            >
              近日公開
            </Badge>
          </div>
        ) : (
          <Link href={item.href}>
            <item.icon className="h-4.5 w-4.5" />
            <span>{item.label}</span>
          </Link>
        )}
      </Button>
    );
  };

  return (
    <div className="flex h-full flex-col gap-6 p-4 overflow-y-auto scrollbar-hide">
      <div className="rounded-xl border border-bpim-border bg-white/5 p-4 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Link href={`/users/${user?.userId}`} onClick={onClose}>
            <Avatar className="h-12 w-12 rounded-lg border border-bpim-border">
              <AvatarImage
                src={user?.profileImage || ""}
                alt={user?.userName || "User"}
              />
              <AvatarFallback className="bg-slate-800 text-slate-400">
                {user?.userName?.slice(0, 2) || "U"}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">
              {user?.userName || "Guest"}
            </p>
            <p className="truncate font-mono text-[10px] text-slate-500">
              {user?.iidxId ? `ID: ${user.iidxId}` : "ID未設定"}
            </p>
            <p className="font-mono text-[10px] font-bold text-bpim-warning">
              ☆12 BPI: {user?.totalBpi ?? -15}
            </p>
          </div>
        </div>

        {user?.userId && (
          <div className="flex flex-col gap-3">
            <Button
              asChild
              variant="outline"
              size="xs"
              className="w-full justify-between border-slate-700 h-7 px-2 hover:bg-white/5"
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
                <p className="text-xs font-bold text-white">
                  {user?.followingCount ?? 0}
                </p>
                <p className="text-[10px] text-slate-500 group-hover:text-slate-300">
                  フォロー
                </p>
              </Link>
              <Link
                href={`/users/${user?.userId}/followers`}
                onClick={onClose}
                className="text-center group"
              >
                <p className="text-xs font-bold text-white">
                  {user?.followerCount ?? 0}
                </p>
                <p className="text-[10px] text-slate-500 group-hover:text-slate-300">
                  フォロワー
                </p>
              </Link>
            </div>
          </div>
        )}
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {mainMenuItems.map((item) => renderMenuItem(item))}

        <Collapsible
          open={isRivalOpen}
          onOpenChange={setIsRivalOpen}
          className="w-full"
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-3 px-3 text-slate-400 hover:bg-white/5 hover:text-white"
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
      </nav>

      <div className="flex flex-col gap-4 pt-4 mt-auto">
        <ApiDogButton />
        <GitHubButton />

        {user?.userId && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center gap-2 text-bpim-danger hover:bg-bpim-danger/10 hover:text-red-300"
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

const ApiDogButton = () => (
  <div className="flex justify-center">
    <a
      href="https://bpim2.apidog.io/"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity"
    >
      <Code2 className="h-4 w-4 text-bpim-primary" />
      <span className="text-[10px] font-bold underline underline-offset-4">
        APIs Now Available!
      </span>
    </a>
  </div>
);

const GitHubButton = () => (
  <Button
    asChild
    variant="outline"
    size="sm"
    className="w-full rounded-full border-bpim-border bg-transparent text-white hover:bg-white/10"
  >
    <a
      href="https://github.com/BPIManager/BPIManager2"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2"
    >
      <Github className="h-4 w-4" />
      <span className="text-[10px] font-bold">
        Available on <span className="text-bpim-primary">GitHub</span>
      </span>
    </a>
  </Button>
);
