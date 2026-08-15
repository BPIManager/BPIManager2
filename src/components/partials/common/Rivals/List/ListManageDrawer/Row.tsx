"use client";

import { useState } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/common/useTranslation";
import type { FollowListSummary } from "@/types/users/followList";

interface Props {
  list: FollowListSummary;
  onRename: (name: string) => Promise<void>;
  onDelete: () => void;
}

const ListManageDrawerRow = ({
  list,
  onRename,
  onDelete,
}: Props) => {
  const { t, tFormat } = useTranslation();
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState(list.name);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveName = async () => {
    const trimmed = draftName.trim();
    if (!trimmed || trimmed === list.name) {
      setIsEditingName(false);
      setDraftName(list.name);
      return;
    }
    setIsSaving(true);
    try {
      await onRename(trimmed);
      setIsEditingName(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-bpim-border bg-bpim-surface-2/60 px-3 py-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {isEditingName ? (
          <>
            <Input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              disabled={isSaving}
              className="h-7 text-xs"
              autoFocus
            />
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={handleSaveName}
              disabled={isSaving}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={() => {
                setIsEditingName(false);
                setDraftName(list.name);
              }}
              disabled={isSaving}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </>
        ) : (
          <>
            <span className="truncate text-sm font-bold text-bpim-text">
              {list.name}
            </span>
            <span className="shrink-0 text-xs text-bpim-muted">
              {tFormat("rivals.list.memberCount", { count: list.memberCount })}
            </span>
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={() => setIsEditingName(true)}
              aria-label={t("rivals.list.rename")}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <Button
          size="icon-xs"
          variant="ghost"
          onClick={onDelete}
          aria-label={t("rivals.list.delete")}
          className="text-bpim-danger hover:bg-bpim-danger/10"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default ListManageDrawerRow;
