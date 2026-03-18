import { Button } from "@/components/ui/button";
import { LuBadgeX, LuTrash2 } from "react-icons/lu";

export default function AccountDeletionUi() {
  return (
    <div className="mt-4 flex flex-col gap-6 rounded-xl border border-red-900/30 bg-bpim-bg p-6 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-bpim-danger">
          <LuBadgeX className="h-4 w-4" />
          <span className="font-bold">アカウント削除</span>
        </div>
        <p className="text-sm text-bpim-muted">
          BPIM2およびBPIMのアカウントを完全に削除します。
        </p>
        <p className="text-[10px] text-bpim-muted italic">
          ※ 現在開発中のため、しばらくお待ちください
        </p>
      </div>
      <Button variant="destructive" disabled className="w-full md:w-auto gap-2">
        <LuTrash2 className="h-4 w-4" />
        確認
      </Button>
    </div>
  );
}
