"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useFollowingWithLists } from "@/hooks/users/useFollowingWithLists";
import { SectionLoader } from "@/components/ui/loading-spinner";
import { useTranslation } from "@/hooks/common/useTranslation";
import RivalListEditRow from "./ui";
import type { FollowListSummary } from "@/types/users/followList";

interface Props {
  userId: string;
  lists: FollowListSummary[];
}

/**
 * `/rivals`編集モードの行リスト。フォロー中ユーザーを1行1人で表示し、
 * 右カラムの`ListMultiSelect`で所属リストを切り替えられる（#277）。
 */
const RivalListEditRows = ({ userId, lists }: Props) => {
  const { following, isLoading, addToList, removeFromList } =
    useFollowingWithLists(userId);
  const { t } = useTranslation();
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set());

  const handleToggleList = async (
    followingId: string,
    listId: number,
    currentlyIn: boolean,
  ) => {
    const key = `${followingId}:${listId}`;
    setPendingKeys((prev) => new Set(prev).add(key));
    try {
      if (currentlyIn) {
        await removeFromList(listId, followingId);
      } else {
        await addToList(listId, followingId);
      }
    } catch {
      toast.error(t("rivals.list.updateFailed"));
    } finally {
      setPendingKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  if (isLoading) return <SectionLoader className="py-10" />;

  if (following.length === 0) {
    return (
      <p className="py-10 text-center text-sm font-medium text-bpim-muted">
        {t("rivals.list.editRowsEmpty")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {following.map((user) => {
        const pending = lists.some((l) =>
          pendingKeys.has(`${user.userId}:${l.id}`),
        );
        return (
          <RivalListEditRow
            key={user.userId}
            user={user}
            lists={lists}
            pending={pending}
            onToggleList={(listId) =>
              handleToggleList(
                user.userId,
                listId,
                user.listIds.includes(listId),
              )
            }
          />
        );
      })}
    </div>
  );
};

export default RivalListEditRows;
