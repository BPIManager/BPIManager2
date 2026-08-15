"use client";

import { useEffect, useMemo, useState } from "react";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { useUser } from "@/contexts/users/UserContext";
import { useRivalSummary } from "@/hooks/social/useRivalSummary";
import { useFollowLists } from "@/hooks/users/useFollowLists";
import RivalFilter from "./filter";
import RivalList from "./container";
import RivalListEditRows from "./EditRows";
import ListManageDrawer from "./ListManageDrawer";
import { LoginRequiredCard } from "@/components/partials/common/Auth/LoginRequired/ui";
import { useRivalListFilter } from "@/hooks/social/useRivalListFilter";
import { useRouter } from "next/router";
import { PageContainer, PageHeader } from "@/components/partials/common/PageChrome/Header";
import { Button } from "@/components/ui/button";
import { ListChecks } from "lucide-react";
import { useTranslation } from "@/hooks/common/useTranslation";

const RivalListContainer = () => {
  const { user, isLoading: isCredentialLoading } = useUser();
  const router = useRouter();
  const { t } = useTranslation();
  const {
    levels,
    difficulties,
    sortOrder,
    listId,
    handleToggleLevel,
    handleToggleDifficulty,
    setSortOrder,
    setListId,
  } = useRivalListFilter();

  const { rivals, isLoading, isError: error } = useRivalSummary({
    userId: user?.userId || false,
    levels,
    difficulties,
    version: latestVersion,
    listId,
  });

  const { lists } = useFollowLists(user?.userId || false);

  const [isEditMode, setIsEditMode] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // 選択中のリストが削除された場合、フィルタを「すべて」に戻す
  // (listIdを保持したままだと、存在しないリストへの絞り込みリクエストが
  // 送られ続けエラー状態から抜けられなくなる)
  useEffect(() => {
    if (listId != null && !lists.some((l) => l.id === listId)) {
      setListId(null);
    }
  }, [listId, lists, setListId]);

  const sortedRivals = useMemo(() => {
    if (!rivals.length) return rivals;
    return [...rivals].sort((a, b) => {
      if (sortOrder === "win_desc") {
        return (b.stats.win - b.stats.lose) - (a.stats.win - a.stats.lose);
      }
      if (sortOrder === "lose_desc") {
        return (b.stats.lose - b.stats.win) - (a.stats.lose - a.stats.win);
      }
      // updated_desc
      const ta = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
      const tb = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
      return tb - ta;
    });
  }, [rivals, sortOrder]);

  if (!user && !isCredentialLoading) return <LoginRequiredCard />;

  return (
    <>
      <PageHeader
        title="ライバル"
        description="フォロー中ライバルの一覧・リスト管理"
        rightElement={
          user && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDrawerOpen(true)}
              >
                <ListChecks className="h-3.5 w-3.5" />
                {t("rivals.list.manage")}
              </Button>
              <Button
                variant={isEditMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsEditMode((v) => !v)}
              >
                {isEditMode ? t("rivals.list.editExit") : t("rivals.list.editEnter")}
              </Button>
            </div>
          )
        }
      />
      <PageContainer>
        <div className="flex w-full flex-col gap-8">
          {isEditMode ? (
            user && <RivalListEditRows userId={user.userId} lists={lists} />
          ) : (
            <>
              <RivalFilter
                levels={levels}
                difficulties={difficulties}
                sortOrder={sortOrder}
                onToggleLevel={handleToggleLevel}
                onToggleDifficulty={handleToggleDifficulty}
                onChangeSortOrder={setSortOrder}
                lists={lists}
                listId={listId}
                onChangeListId={setListId}
              />
              <RivalList
                results={sortedRivals}
                isLoading={isLoading}
                error={error}
                onCardClick={(id: string) => router.push(`/rivals/${id}`)}
              />
            </>
          )}
        </div>
      </PageContainer>

      {user && (
        <ListManageDrawer
          userId={user.userId}
          open={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
        />
      )}
    </>
  );
};

export default RivalListContainer;
