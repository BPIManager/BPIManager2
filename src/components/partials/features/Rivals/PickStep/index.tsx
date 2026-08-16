"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useFollowingWithLists } from "@/hooks/users/useFollowingWithLists";
import { useFollowLists } from "@/hooks/users/useFollowLists";
import { useTranslation } from "@/hooks/common/useTranslation";
import { MAX_COMPARISON_MEMBERS } from "@/constants/logic/rivalComparison";
import type { VirtualRivalKey } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  primaryRivalId: string;
  selectedIds: string[];
  onToggleSelected: (rivalUserId: string) => void;
  virtualKeys: VirtualRivalKey[];
  onToggleVirtual: (key: VirtualRivalKey) => void;
  onBulkAddFromList: (memberIds: string[]) => void;
}

/**
 * 比較ページの比較メンバーを編集するモーダル(#287)。
 *
 * 行のチェックマーク(左側)を押すと複数選択(現在の比較に追加/除外)、
 * 行全体をクリックするとその1人だけとの1:1比較ページへ遷移する
 * （ユーザー指定のUI挙動）。フォロー中ユーザーのみが候補（比較対象は
 * 常にフォロー中かつ閲覧可能なユーザーに限られるため、検索も
 * `useFollowingWithLists`のクライアント側フィルタで完結させ、
 * 新たな検索APIは用意しない）。
 */
const RivalPickStep = ({
  open,
  onOpenChange,
  userId,
  primaryRivalId,
  selectedIds,
  onToggleSelected,
  virtualKeys,
  onToggleVirtual,
  onBulkAddFromList,
}: Props) => {
  const { t, tFormat } = useTranslation();
  const router = useRouter();
  const { following } = useFollowingWithLists(userId);
  const { lists } = useFollowLists(userId);
  const [search, setSearch] = useState("");

  const totalSelected = 2 + selectedIds.length; // 自分 + primaryRivalId + 追加分
  const remaining = MAX_COMPARISON_MEMBERS - totalSelected;
  const isCapReached = remaining <= 0;

  const candidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return following
      .filter((u) => u.userId !== primaryRivalId)
      .filter((u) => !q || (u.userName ?? "").toLowerCase().includes(q));
  }, [following, primaryRivalId, search]);

  const handleRowClick = (rivalUserId: string) => {
    onOpenChange(false);
    router.push(`/rivals/${rivalUserId}`);
  };

  const handleBulkAddList = (listId: number) => {
    const memberIds = following
      .filter((u) => u.listIds.includes(listId) && u.userId !== primaryRivalId)
      .map((u) => u.userId)
      .filter((id) => !selectedIds.includes(id));
    onBulkAddFromList(memberIds.slice(0, Math.max(0, remaining)));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-4 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("rivals.pickStep.title")}</DialogTitle>
          <DialogDescription>{t("rivals.pickStep.desc")}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-2">
          <Badge variant={isCapReached ? "destructive" : "secondary"}>
            {tFormat("rivals.pickStep.selectedCount", {
              count: totalSelected,
              max: MAX_COMPARISON_MEMBERS,
            })}
          </Badge>
        </div>

        <div className="flex flex-col gap-2">
          <span className="px-1 text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
            {t("rivals.pickStep.virtualSectionLabel")}
          </span>
          {(["wr", "kaidenAvg"] as const).map((key) => {
            const checked = virtualKeys.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => onToggleVirtual(key)}
                className="flex w-full items-center gap-3 rounded-lg border border-bpim-border bg-bpim-surface-2/60 px-3 py-2 text-left hover:bg-bpim-overlay"
              >
                <Checkbox checked={checked} className="pointer-events-none" />
                <span className="text-sm font-bold text-bpim-text">
                  {t(key === "wr" ? "rivals.pickStep.wr" : "rivals.pickStep.kaidenAvg")}
                </span>
              </button>
            );
          })}
        </div>

        {lists.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="px-1 text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
              {t("rivals.pickStep.listSectionLabel")}
            </span>
            <div className="flex flex-wrap gap-2">
              {lists.map((list) => (
                <Button
                  key={list.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isCapReached}
                  onClick={() => handleBulkAddList(list.id)}
                >
                  {list.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        <Separator />

        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("rivals.pickStep.searchPlaceholder")}
          className="shrink-0"
        />

        <div className="flex flex-col gap-1.5 overflow-y-auto">
          {candidates.map((u) => {
            const checked = selectedIds.includes(u.userId);
            const disabled = !checked && isCapReached;
            return (
              <div
                key={u.userId}
                className="flex w-full items-center gap-3 rounded-lg border border-bpim-border bg-bpim-surface-2/60 px-3 py-2"
              >
                <Checkbox
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={() => onToggleSelected(u.userId)}
                />
                <button
                  type="button"
                  onClick={() => handleRowClick(u.userId)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <Avatar className="h-8 w-8 border border-bpim-border">
                    <AvatarImage src={u.profileImage ?? ""} />
                    <AvatarFallback>{u.userName?.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span className="truncate text-sm font-bold text-bpim-text">
                    {u.userName}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RivalPickStep;
