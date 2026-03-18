import { Box, IconButton, Badge, Tabs } from "@chakra-ui/react";
import { Bell } from "lucide-react";
import {
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverRoot,
  PopoverTrigger,
} from "@/components/ui/chakra/popover";
import { useState } from "react";
import { useNotifications } from "@/hooks/users/useNotifications";
import { NotificationItem } from "./item";
import { InfiniteScrollContainer } from "../InfiniteScroll/ui";

export const NotificationBell = () => {
  const [activeTab, setActiveTab] = useState<"all" | "follow" | "overtaken">(
    "all",
  );

  const notificationRes = useNotifications(activeTab);
  const { unreadCount, markAsRead } = notificationRes;

  return (
    <PopoverRoot portalled onOpenChange={(e) => e.open && markAsRead()}>
      <PopoverTrigger asChild>
        <Box position="relative" cursor="pointer">
          <IconButton variant="ghost" aria-label="Notifications">
            <Bell size={20} />
          </IconButton>
          {unreadCount > 0 && (
            <Badge
              position="absolute"
              top="0"
              right="0"
              transform="translate(30%, -30%)"
              colorPalette="red"
              variant="solid"
              borderRadius="full"
              minW="18px"
              height="18px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="10px"
              px={1}
              zIndex="docked"
              pointerEvents="none"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Box>
      </PopoverTrigger>

      <PopoverContent w="350px" maxH="500px" overflow="hidden">
        <PopoverArrow />
        <PopoverBody p={0}>
          <Tabs.Root
            value={activeTab}
            onValueChange={(e) => setActiveTab(e.value as any)}
          >
            <Tabs.List w="full">
              {["all", "follow", "overtaken"].map((tab) => (
                <Tabs.Trigger
                  key={tab}
                  value={tab}
                  flex="1"
                  justifyContent="center"
                >
                  {tab === "all"
                    ? "すべて"
                    : tab === "follow"
                      ? "フォロー"
                      : "スコア更新"}
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            <Box p={2}>
              <InfiniteScrollContainer
                items={notificationRes.notifications}
                setSize={notificationRes.setSize}
                isLoadingMore={notificationRes.isLoadingMore}
                isReachingEnd={notificationRes.isReachingEnd}
                maxH="400px"
                emptyMessage="通知はありません"
                renderItem={(n, i) => (
                  <NotificationItem key={`${n.timestamp}-${i}`} n={n} />
                )}
              />
            </Box>
          </Tabs.Root>
        </PopoverBody>
      </PopoverContent>
    </PopoverRoot>
  );
};
