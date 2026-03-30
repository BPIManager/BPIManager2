import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BadgeX, Trash2, TriangleAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
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

      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2 text-bpim-danger">
              <TriangleAlert className="h-5 w-5" />
              <DialogTitle>アカウントを削除しますか？</DialogTitle>
            </div>
            <DialogDescription className="flex flex-col gap-3 pt-1">
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
            </DialogDescription>
          </DialogHeader>

          <Input
            value={confirmUserName}
            onChange={(e) => setConfirmUserName(e.target.value)}
            placeholder={userName}
            disabled={isDeleting}
            autoComplete="off"
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isDeleting}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!isConfirmed || isDeleting}
              className="gap-2"
            >
              {isDeleting ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {isDeleting ? "削除中..." : "削除する"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
