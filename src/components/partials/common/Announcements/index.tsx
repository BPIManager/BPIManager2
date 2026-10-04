"use client";

import { ExternalLink, Newspaper } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/users/UserContext";
import { useTranslation } from "@/hooks/common/useTranslation";
import { useAnnouncements } from "@/hooks/announcements/useAnnouncements";
import { markAnnouncementsRead } from "@/services/swr/announcements/markRead";
import type { Announcement } from "@/types/announcements";

const ITEM_CLASS = "flex flex-col gap-1.5 border-b border-bpim-border px-4 py-3 last:border-b-0";

/**
 * お知らせのアイコン。未読件数をバッジで表示し、開いたときに一覧のお知らせを既読にする。
 * リンク先があるお知らせは項目全体がリンクになる。
 */
export default function AnnouncementBell() {
  const { t, locale } = useTranslation();
  const { fbUser } = useUser();
  const { items, unreadCount, refresh } = useAnnouncements();

  const handleOpenChange = async (open: boolean) => {
    if (!open || !fbUser || unreadCount === 0) return;
    try {
      await markAnnouncementsRead(fbUser);
      await refresh();
    } catch {
      // 既読化に失敗しても一覧は表示できるため、次回の表示で再試行する
    }
  };

  const badge = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 cursor-pointer text-bpim-muted hover:text-bpim-text"
          aria-label={
            unreadCount > 0
              ? `${t("announcements.trigger.label")} (${badge})`
              : t("announcements.trigger.label")
          }
        >
          <Newspaper size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-bpim-primary px-1 font-mono text-[10px] font-bold text-bpim-text ring-2 ring-bpim-bg">
              {badge}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-87.5 overflow-hidden border-bpim-border bg-bpim-surface-2 p-0 shadow-2xl"
      >
        <div className="border-b border-bpim-border bg-bpim-bg/50 px-4 py-3 text-sm font-bold text-bpim-text">
          {t("announcements.title")}
        </div>
        <div className="flex max-h-100 flex-col overflow-y-auto">
          {items.length === 0 ? (
            <p className="p-6 text-center text-sm text-bpim-muted">{t("announcements.empty")}</p>
          ) : (
            items.map((a) =>
              a.linkUrl ? (
                <a
                  key={a.id}
                  href={a.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${ITEM_CLASS} transition-colors hover:bg-bpim-overlay/40`}
                >
                  <AnnouncementBody announcement={a} locale={locale} showExternalIcon />
                </a>
              ) : (
                <div key={a.id} className={ITEM_CLASS}>
                  <AnnouncementBody announcement={a} locale={locale} />
                </div>
              ),
            )
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function AnnouncementBody({
  announcement: a,
  locale,
  showExternalIcon = false,
}: {
  announcement: Announcement;
  locale: string;
  showExternalIcon?: boolean;
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="text-sm font-bold text-bpim-text">{a.title}</h3>
          <time className="text-[11px] text-bpim-muted" dateTime={a.publishedAt}>
            {new Date(a.publishedAt).toLocaleDateString(locale)}
          </time>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {!a.isRead && <span className="h-2 w-2 rounded-full bg-bpim-primary" />}
          {showExternalIcon && <ExternalLink className="h-3.5 w-3.5 text-bpim-muted" />}
        </div>
      </div>
      <p className="whitespace-pre-line text-xs leading-relaxed text-bpim-muted">{a.body}</p>
    </>
  );
}
