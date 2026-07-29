import { JSX } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ExternalLink, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/common/useTranslation";

export interface SidebarMenuItem {
  label: string;
  icon: LucideIcon | ((props: { className?: string }) => JSX.Element);
  href: string;
  exact?: boolean;
  isExternal?: boolean;
  isComingSoon?: boolean;
  isBeta?: boolean;
}

const labelCn =
  "flex-1 text-left whitespace-nowrap overflow-hidden opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100";

interface MenuItemButtonProps {
  item: SidebarMenuItem;
  isNested?: boolean;
  /** サイドバーが展開表示中かどうか */
  expanded: boolean;
  onClose?: () => void;
}

/** サイドバーの通常/ネストされたメニュー項目ボタン */
export const MenuItemButton = ({
  item,
  isNested = false,
  expanded,
  onClose,
}: MenuItemButtonProps) => {
  const router = useRouter();
  const { t } = useTranslation();

  const labelStyle = expanded ? { opacity: 1 } : undefined;
  const showFlex = !expanded ? "hidden group-hover/sidebar:flex" : "";
  const showBlock = !expanded ? "hidden group-hover/sidebar:block" : "";

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

interface ScoreSubItemButtonProps {
  item: { label: string; icon: LucideIcon; href: string };
  expanded: boolean;
  onClose?: () => void;
}

/** スコアセクション配下のサブ項目ボタン(通常のMenuItemButtonよりシンプルな表示) */
export const ScoreSubItemButton = ({
  item,
  expanded,
  onClose,
}: ScoreSubItemButtonProps) => {
  const router = useRouter();
  const labelStyle = expanded ? { opacity: 1 } : undefined;

  const isActive =
    router.asPath === item.href ||
    router.asPath.startsWith(item.href + "/") ||
    router.asPath.startsWith(item.href + "?");

  return (
    <Button
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
