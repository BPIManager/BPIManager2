"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Info } from "lucide-react";
import { useFollowingWithLists } from "@/hooks/users/useFollowingWithLists";
import { useFollowLists } from "@/hooks/users/useFollowLists";
import { SectionLoader } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  const { createList } = useFollowLists(userId);
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

  // Select内の「リストがありません」から直接作成したとき、作成した
  // リストへその場でこの行のユーザーを追加する(作成する動機は大抵
  // 「このユーザーを入れるリストが無い」ことのため)
  const handleCreateAndAssign = async (followingId: string, name: string) => {
    const newListId = await createList(name, false);
    if (newListId != null) {
      await handleToggleList(followingId, newListId, false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Alert variant="info">
        <Info />
        <AlertDescription>{t("rivals.list.editModeAlert")}</AlertDescription>
      </Alert>

      {isLoading ? (
        <SectionLoader className="py-10" />
      ) : following.length === 0 ? (
        <p className="py-10 text-center text-sm font-medium text-bpim-muted">
          {t("rivals.list.editRowsEmpty")}
        </p>
      ) : (
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
                onCreateList={(name) =>
                  handleCreateAndAssign(user.userId, name)
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RivalListEditRows;
