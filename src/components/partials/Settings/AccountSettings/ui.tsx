import { LuUser, LuSettings2 } from "react-icons/lu";
import { useState } from "react";
import AccountSettings from "../../Modal/AccountSettings";
import { Button } from "@/components/ui/button";

export default function AccountSettingsUi() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="mt-4 flex flex-col gap-6 rounded-xl border border-bpim-border bg-bpim-bg p-6 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-blue-400">
          <LuUser className="h-4 w-4" />
          <span className="font-bold">プロフィール設定</span>
        </div>
        <p className="text-sm text-slate-400">
          BPIM2のユーザープロフィールを設定します。
        </p>
      </div>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="w-full md:w-auto gap-2"
      >
        <LuSettings2 className="h-4 w-4" />
        開く
      </Button>
      <AccountSettings isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}
