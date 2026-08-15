"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MoreVertical, UserX } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import ActionConfirmDialog from "@/components/partials/modal/Confirmation";
import { useUser } from "@/contexts/users/UserContext";
import { useIsOwnProfile } from "@/hooks/users/useIsOwnProfile";
import { useForceUnfollow } from "@/hooks/users/useForceUnfollow";
import { useTranslation } from "@/hooks/common/useTranslation";
import { UserRelationship } from "@/types/users/profile";

/**
 * 「強制フォロー解除」用の三点メニュー。
 *
 * 閲覧中のプロフィールの相手が自分をフォローしている場合のみ表示する
 * （それ以外のケースでは解除する対象の`follows`関係がないため）。
 * 自分が公開設定かどうかは問わない（非公開ユーザーに限らず、任意の
 * フォロワーを外したいケースがあるため）。
 */
const ForceUnfollowMenu = ({
  userId,
  relationship,
  onSuccess,
}: {
  userId: string;
  relationship: UserRelationship;
  /** 強制フォロー解除が成功した後に呼ばれる（閲覧中プロフィールの再取得等に使う） */
  onSuccess?: () => void;
}) => {
  const { t } = useTranslation();
  const { user } = useUser();
  const isMe = useIsOwnProfile(userId);
  const { forceUnfollow, isUpdating } = useForceUnfollow(userId);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  if (isMe || !user || !relationship.isFollowedBy) {
    return null;
  }

  const handleConfirm = async () => {
    try {
      await forceUnfollow();
    } catch {
      toast.error(t("follow.forceUnfollow.failed"));
      return;
    }
    setIsConfirmOpen(false);
    onSuccess?.();
  };

  return (
    <>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0 rounded-full"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-auto border-bpim-border bg-bpim-surface-2 p-1"
        >
          <button
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-bpim-danger hover:bg-bpim-overlay"
            onClick={() => {
              setIsPopoverOpen(false);
              setIsConfirmOpen(true);
            }}
          >
            <UserX className="h-4 w-4" />
            {t("follow.forceUnfollow.action")}
          </button>
        </PopoverContent>
      </Popover>

      <ActionConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirm}
        isLoading={isUpdating}
        title={t("follow.forceUnfollow.dialogTitle")}
        description={t(
          user.isPublic
            ? "follow.forceUnfollow.dialogDescPublic"
            : "follow.forceUnfollow.dialogDescPrivate",
        )}
        confirmLabel={t("follow.forceUnfollow.action")}
        isDestructive
      />
    </>
  );
};

export default ForceUnfollowMenu;
