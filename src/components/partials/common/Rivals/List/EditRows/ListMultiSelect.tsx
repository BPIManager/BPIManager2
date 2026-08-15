"use client";

import { useState } from "react";
import { Select, SelectContent, SelectTrigger } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "@/hooks/common/useTranslation";
import type { FollowListSummary } from "@/types/users/followList";

interface Props {
  lists: FollowListSummary[];
  selectedListIds: number[];
  onToggle: (listId: number) => void;
  disabled?: boolean;
}

/**
 * フォロー中ユーザー1人を、複数のリストへ同時に所属させるためのSelect。
 *
 * 標準の`Select`は単一値選択が前提のため、ここでは`value`/`onValueChange`は
 * 使わず`open`のみを制御し、`SelectContent`内をチェックボックス項目の
 * 素のリストとして描画する（`SelectItem`はクリックで自動的に閉じるため
 * 複数選択に使えない）。
 */
const ListMultiSelect = ({
  lists,
  selectedListIds,
  onToggle,
  disabled,
}: Props) => {
  const { t, tFormat } = useTranslation();
  const [open, setOpen] = useState(false);

  const label =
    selectedListIds.length === 0
      ? t("rivals.list.unclassified")
      : selectedListIds.length === 1
        ? (lists.find((l) => l.id === selectedListIds[0])?.name ??
          tFormat("rivals.list.selectedCount", { count: 1 }))
        : tFormat("rivals.list.selectedCount", { count: selectedListIds.length });

  return (
    <Select open={open} onOpenChange={setOpen}>
      <SelectTrigger
        size="sm"
        disabled={disabled}
        className="h-8 w-40 border-bpim-border bg-bpim-bg/20 text-xs text-bpim-text"
      >
        <span className="truncate">{label}</span>
      </SelectTrigger>
      <SelectContent className="border-bpim-border bg-bpim-bg">
        {lists.length === 0 ? (
          <div className="px-2 py-1.5 text-xs text-bpim-muted">
            {t("rivals.list.empty")}
          </div>
        ) : (
          lists.map((list) => {
            const checked = selectedListIds.includes(list.id);
            return (
              <div
                key={list.id}
                role="option"
                aria-selected={checked}
                onClick={() => onToggle(list.id)}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-bpim-text hover:bg-bpim-overlay"
              >
                <Checkbox checked={checked} className="pointer-events-none" />
                <span className="truncate">{list.name}</span>
              </div>
            );
          })
        )}
      </SelectContent>
    </Select>
  );
};

export default ListMultiSelect;
