import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs } from "@/components/ui/tabs";
import { useNotifications } from "@/hooks/users/useNotifications";
import { Bell } from "lucide-react";
import { useState } from "react";
import { InfiniteScrollContainer } from "../InfiniteScroll/ui";
import { NotificationItem } from "./item";
import { Button } from "@/components/ui/button";
import { AppTabsGroup } from "@/components/ui/complex/tabs";

export const NotificationBell = () => {
  const [activeTab, setActiveTab] = useState<"all" | "follow" | "overtaken">(
    "all",
  );

  const notificationRes = useNotifications(activeTab);
  const {
    unreadCount,
    markAsRead,
    notifications,
    setSize,
    isLoadingMore,
    isReachingEnd,
  } = notificationRes;

  return (
    <Popover onOpenChange={(open) => open && markAsRead()}>
      <PopoverTrigger asChild>
        <div className="relative cursor-pointer">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-bpim-muted hover:text-bpim-text"
          >
            <Bell size={20} />
          </Button>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-bpim-danger px-1 font-mono text-[10px] font-bold text-bpim-text ring-2 ring-bpim-bg">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[350px] overflow-hidden border-bpim-border bg-bpim-surface-2 p-0 shadow-2xl"
      >
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as any)}
          className="w-full"
        >
          <AppTabsGroup
            visual="minimal"
            listClassName="rounded-none border-b border-bpim-border bg-bpim-bg/50"
            tabs={[
              { value: "all", label: "すべて" },
              { value: "follow", label: "フォロー" },
              { value: "overtaken", label: "更新" },
            ]}
          />
          <div className="max-h-100 p-2">
            <InfiniteScrollContainer
              items={notifications}
              setSize={setSize}
              isLoadingMore={isLoadingMore}
              isReachingEnd={isReachingEnd}
              maxH="400px"
              emptyMessage="通知はありません"
              renderItem={(n, i) => (
                <NotificationItem key={`${n.timestamp}-${i}`} n={n} />
              )}
            />
          </div>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};
