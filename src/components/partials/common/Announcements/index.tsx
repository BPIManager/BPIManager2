"use client";

import { Newspaper } from "lucide-react";
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

/**
 * お知らせのアイコン。未読件数をバッジで表示し、開いたときに一覧のお知らせを既読にする。
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
        <div className="flex max-h-100 flex-col gap-2 overflow-y-auto p-2">
          {items.length === 0 ? (
            <p className="p-6 text-center text-sm text-bpim-muted">{t("announcements.empty")}</p>
          ) : (
            items.map((a) => (
              <article key={a.id} className="flex flex-col gap-1.5 rounded-lg border border-bpim-border bg-bpim-surface px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-bpim-text">{a.title}</h3>
                  {!a.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-bpim-primary" />}
                </div>
                <time className="text-[11px] text-bpim-muted" dateTime={a.publishedAt}>
                  {new Date(a.publishedAt).toLocaleDateString(locale)}
                </time>
                <p className="whitespace-pre-line text-xs leading-relaxed text-bpim-muted">{a.body}</p>
                {a.linkUrl && (
                  <a
                    href={a.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="self-start text-xs font-bold text-bpim-primary underline underline-offset-2"
                  >
                    {t("announcements.openLink")}
                  </a>
                )}
              </article>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
