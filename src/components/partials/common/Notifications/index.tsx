import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs } from "@/components/ui/tabs";
import { useNotifications } from "@/hooks/users/useNotifications";
import { useFollowRequests } from "@/hooks/users/useFollowRequests";
import { Bell } from "lucide-react";
import { useState } from "react";
import InfiniteScrollContainer from "@/components/partials/common/ListControls/InfiniteScroll/ui";
import NotificationItem from "./item";
import NotificationRequestItem from "./requestItem";
import { Button } from "@/components/ui/button";
import { AppTabsGroup } from "@/components/ui/complex/tabs";
import { useTranslation } from "@/hooks/common/useTranslation";

type NotificationTab = "all" | "follow" | "overtaken" | "requests";

const NotificationBell = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<NotificationTab>("all");

  const notificationRes = useNotifications(
    activeTab === "requests" ? "all" : activeTab,
  );
  const {
    unreadCount,
    markAsRead,
    notifications,
    setSize,
    isLoadingMore,
    isReachingEnd,
    isError,
  } = notificationRes;

  const {
    requests,
    isLoading: isLoadingRequests,
    approve,
    reject,
  } = useFollowRequests();

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
            <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-bpim-danger px-1 font-mono text-[10px] font-bold text-bpim-text ring-2 ring-bpim-bg">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-87.5 overflow-hidden border-bpim-border bg-bpim-surface-2 p-0 shadow-2xl"
      >
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as NotificationTab)}
          className="w-full"
        >
          <AppTabsGroup
            visual="minimal"
            listClassName="rounded-none border-b border-bpim-border bg-bpim-bg/50"
            tabs={[
              { value: "all", label: t("notifications.tab.all") },
              { value: "follow", label: t("notifications.tab.follow") },
              { value: "overtaken", label: t("notifications.tab.overtaken") },
              {
                value: "requests",
                label:
                  requests.length > 0
                    ? `${t("notifications.tab.requests")} (${requests.length})`
                    : t("notifications.tab.requests"),
              },
            ]}
          />
          <div className="max-h-100 p-2">
            {activeTab === "requests" ? (
              requests.length === 0 ? (
                <p className="p-6 text-center text-sm text-bpim-muted">
                  {isLoadingRequests ? "" : t("notifications.requests.empty")}
                </p>
              ) : (
                requests.map((r) => (
                  <NotificationRequestItem
                    key={r.id}
                    request={r}
                    onApprove={approve}
                    onReject={reject}
                  />
                ))
              )
            ) : (
              <InfiniteScrollContainer
                items={notifications}
                setSize={setSize}
                isLoadingMore={isLoadingMore}
                isReachingEnd={isReachingEnd}
                isError={isError}
                maxH="400px"
                emptyMessage={t("notifications.empty")}
                renderItem={(n, i) => (
                  <NotificationItem key={`${n.timestamp}-${i}`} n={n} />
                )}
              />
            )}
          </div>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
