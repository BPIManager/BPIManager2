"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, Plus } from "lucide-react";
import { useTranslation } from "@/hooks/common/useTranslation";
import type { FollowListSummary } from "@/types/users/followList";

interface Props {
  lists: FollowListSummary[];
  selectedListIds: number[];
  onToggle: (listId: number) => void;
  onCreateList: (name: string) => Promise<void>;
  disabled?: boolean;
}

/**
 * フォロー中ユーザー1人を、複数のリストへ同時に所属させるためのチェック
 * ボックス式ドロップダウン。
 *
 * 標準の`Select`(Radix)は単一値選択・選択済み項目のアラインメント計算が
 * 前提のコンポーネントで、`SelectItem`を使わずチェックボックス項目を
 * 独自描画すると内部の位置計算が破綻しコンテンツが開かない不具合が
 * 起きたため、位置計算に依存しない`Popover`をベースに実装する。
 *
 * 新規リスト作成フォームは常に表示する。ドロワーへ移動させず、この場で
 * リストを作ってすぐ行のユーザーを追加できるようにするため。
 */
const ListMultiSelect = ({
  lists,
  selectedListIds,
  onToggle,
  onCreateList,
  disabled,
}: Props) => {
  const { t, tFormat } = useTranslation();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const label =
    selectedListIds.length === 0
      ? t("rivals.list.unclassified")
      : selectedListIds.length === 1
        ? (lists.find((l) => l.id === selectedListIds[0])?.name ??
          tFormat("rivals.list.selectedCount", { count: 1 }))
        : tFormat("rivals.list.selectedCount", { count: selectedListIds.length });

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed || isCreating) return;
    setIsCreating(true);
    try {
      await onCreateList(trimmed);
      setNewName("");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="h-8 w-40 justify-between border-bpim-border bg-bpim-bg/20 text-xs font-normal text-bpim-text"
        >
          <span className="truncate">{label}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-bpim-muted" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-48 border-bpim-border bg-bpim-bg p-1"
      >
        {lists.length === 0 ? (
          <div className="px-2 py-1.5 text-xs text-bpim-muted">
            {t("rivals.list.empty")}
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {lists.map((list) => {
              const checked = selectedListIds.includes(list.id);
              return (
                <button
                  key={list.id}
                  type="button"
                  onClick={() => onToggle(list.id)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-bpim-text hover:bg-bpim-overlay"
                >
                  <Checkbox checked={checked} className="pointer-events-none" />
                  <span className="truncate">{list.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {lists.length > 0 && <Separator className="my-1" />}

        <div className="flex items-center gap-1.5 p-1">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t("rivals.list.createPlaceholder")}
            disabled={isCreating}
            className="h-7 text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
            }}
          />
          <Button
            type="button"
            size="icon-sm"
            onClick={handleCreate}
            disabled={isCreating || !newName.trim()}
            aria-label={t("rivals.list.create")}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ListMultiSelect;
