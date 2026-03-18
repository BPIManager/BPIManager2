import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNotifications } from "@/hooks/users/useNotifications";
import { Bell } from "lucide-react";
import { useState } from "react";
import { InfiniteScrollContainer } from "../InfiniteScroll/ui";
import { NotificationItem } from "./item";
import { Button } from "@/components/ui/button";

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
            className="h-9 w-9 text-slate-400 hover:text-white"
          >
            <Bell size={20} />
          </Button>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 font-mono text-[10px] font-bold text-white ring-2 ring-slate-950">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[350px] overflow-hidden border-white/10 bg-slate-900 p-0 shadow-2xl"
      >
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as any)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 rounded-none border-b border-white/5 bg-slate-950/50 p-1">
            <TabsTrigger
              value="all"
              className="text-xs font-bold data-[state=active]:bg-blue-600"
            >
              すべて
            </TabsTrigger>
            <TabsTrigger
              value="follow"
              className="text-xs font-bold data-[state=active]:bg-blue-600"
            >
              フォロー
            </TabsTrigger>
            <TabsTrigger
              value="overtaken"
              className="text-xs font-bold data-[state=active]:bg-blue-600"
            >
              更新
            </TabsTrigger>
          </TabsList>
          <div className="max-h-[400px] overflow-y-auto p-2">
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
