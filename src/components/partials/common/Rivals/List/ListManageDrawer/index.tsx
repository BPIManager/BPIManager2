"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFollowLists } from "@/hooks/users/useFollowLists";
import { useTranslation } from "@/hooks/common/useTranslation";
import ActionConfirmDialog from "@/components/partials/modal/Confirmation";
import ListManageDrawerRow from "./Row";

interface Props {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * フォローリストの作成・改名・削除を行うVaulドロワー(#277)。
 *
 * `/rivals`編集モードから開く。リストは本人以外に共有されない前提のため、
 * ここでの操作は常に本人（`userId`）のリストのみを対象にする。公開設定
 * (`isPublic`)は第三者への公開経路が存在しない現状ではUIから操作できる
 * 意味がないため、あえて表示しない（DB・APIには温存済み）。
 */
const ListManageDrawer = ({ userId, open, onOpenChange }: Props) => {
  const { lists, createList, renameList, deleteList } = useFollowLists(
    userId,
  );
  const { t } = useTranslation();
  const [newName, setNewName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setIsCreating(true);
    try {
      await createList(trimmed, false);
      setNewName("");
    } catch {
      toast.error(t("rivals.list.updateFailed"));
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async () => {
    if (deleteTargetId === null) return;
    setIsDeleting(true);
    try {
      await deleteList(deleteTargetId);
      setDeleteTargetId(null);
    } catch {
      toast.error(t("rivals.list.updateFailed"));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t("rivals.list.manageTitle")}</DrawerTitle>
            <DrawerDescription>{t("rivals.list.manageDesc")}</DrawerDescription>
          </DrawerHeader>

          <div className="flex flex-col gap-4 overflow-y-auto p-4 pt-0">
            <div className="flex items-center gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t("rivals.list.createPlaceholder")}
                disabled={isCreating}
                className="h-8 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                }}
              />
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={isCreating || !newName.trim()}
              >
                <Plus className="h-3.5 w-3.5" />
                {t("rivals.list.create")}
              </Button>
            </div>

            {lists.length === 0 ? (
              <p className="py-6 text-center text-sm text-bpim-muted">
                {t("rivals.list.empty")}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {lists.map((list) => (
                  <ListManageDrawerRow
                    key={list.id}
                    list={list}
                    onRename={(name) => renameList(list.id, name)}
                    onDelete={() => setDeleteTargetId(list.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <ActionConfirmDialog
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title={t("rivals.list.deleteConfirmTitle")}
        description={t("rivals.list.deleteConfirmDesc")}
        confirmLabel={t("rivals.list.delete")}
        cancelLabel={t("rivals.list.cancel")}
        isDestructive
      />
    </>
  );
};

export default ListManageDrawer;
