"use client";

import { useState } from "react";
import dayjs from "@/lib/dayjs";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/common/useTranslation";
import type { PendingFollowRequest } from "@/hooks/users/useFollowRequests";

const NotificationRequestItem = ({
  request,
  onApprove,
  onReject,
}: {
  request: PendingFollowRequest;
  onApprove: (request: PendingFollowRequest) => Promise<void>;
  onReject: (request: PendingFollowRequest) => Promise<void>;
}) => {
  const { t } = useTranslation();
  const [isUpdating, setIsUpdating] = useState(false);

  const handle = async (
    action: (request: PendingFollowRequest) => Promise<void>,
  ) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      await action(request);
    } catch {
      toast.error(t("notifications.requests.actionFailed"));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center gap-3 border-b border-bpim-border p-3 last:border-b-0">
      <Avatar className="h-9 w-9 border border-bpim-border">
        <AvatarImage
          src={request.requesterImage ?? ""}
          alt={request.requesterName}
        />
        <AvatarFallback>{request.requesterName.slice(0, 2)}</AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-[10px] text-bpim-muted">
          {dayjs(request.createdAt).fromNow()}
        </span>
        <div className="text-sm leading-snug text-bpim-text">
          <span className="font-bold text-bpim-text">
            {request.requesterName}
          </span>
          {request.kind === "legacy"
            ? t("notifications.requests.legacyMsg")
            : t("notifications.requests.msg")}
          {request.kind === "legacy" && (
            <Badge
              variant="secondary"
              className="ml-2 h-4 px-1.5 text-[10px] font-bold"
            >
              {t("notifications.requests.legacyBadge")}
            </Badge>
          )}
        </div>
        <div className="mt-1 flex gap-2">
          <Button
            size="sm"
            className="h-7 px-3 text-xs"
            disabled={isUpdating}
            onClick={() => handle(onApprove)}
          >
            {t("notifications.requests.approve")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-3 text-xs"
            disabled={isUpdating}
            onClick={() => handle(onReject)}
          >
            {t("notifications.requests.reject")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotificationRequestItem;
