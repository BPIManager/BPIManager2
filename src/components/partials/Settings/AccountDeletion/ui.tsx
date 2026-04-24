import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BadgeX, Trash2 } from "lucide-react";
import { ActionConfirmDialog } from "../../Modal/Confirmation";
import { useAccountDeletion } from "@/hooks/users/useAccountDeletion";

export default function AccountDeletionUi() {
  const {
    isOpen,
    handleOpen,
    handleClose,
    confirmUserName,
    setConfirmUserName,
    isConfirmed,
    isDeleting,
    handleDelete,
    userName,
  } = useAccountDeletion();

  return (
    <>
      <div className="mt-4 flex flex-col gap-6 rounded-xl border border-red-900/30 bg-bpim-bg p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-bpim-danger">
            <BadgeX className="h-4 w-4" />
            <span className="font-bold">アカウント削除</span>
          </div>
          <p className="text-sm text-bpim-muted">
            BPIM2およびBPIMのアカウントを完全に削除します。
          </p>
          <p className="text-[10px] text-bpim-muted italic">
            ※ この操作は取り消しできません
          </p>
        </div>
        <Button
          variant="destructive"
          onClick={handleOpen}
          className="w-full md:w-auto gap-2"
        >
          <Trash2 className="h-4 w-4" />
          確認
        </Button>
      </div>

      <ActionConfirmDialog
        isOpen={isOpen}
        onClose={handleClose}
        onConfirm={handleDelete}
        isDestructive
        isLoading={isDeleting}
        isConfirmDisabled={!isConfirmed}
        title="アカウントを削除しますか？"
        confirmLabel="削除する"
        description={
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 text-sm text-bpim-muted">
              <span>
                この操作は
                <strong className="text-bpim-text">取り消しできません</strong>。
                スコア・フォロー・すべてのデータが完全に削除されます。
              </span>
              <span>
                削除を実行するには、ユーザー名{" "}
                <strong className="text-bpim-text font-mono">{userName}</strong>{" "}
                を入力してください。
              </span>
            </div>
            <Input
              value={confirmUserName}
              onChange={(e) => setConfirmUserName(e.target.value)}
              placeholder={userName}
              disabled={isDeleting}
              autoComplete="off"
            />
          </div>
        }
      />
    </>
  );
}
