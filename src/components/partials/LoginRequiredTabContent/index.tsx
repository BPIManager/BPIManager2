import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLoginDialog } from "@/hooks/common/useLoginDialog";
import { LoginDialog } from "./LoginDialog";

interface LoginRequiredTabContentProps {
  feature: string;
}

export function LoginRequiredTabContent({
  feature,
}: LoginRequiredTabContentProps) {
  const { isOpen, open, close } = useLoginDialog();

  return (
    <div className="mt-4 flex flex-col items-center gap-4 rounded-xl border border-bpim-border bg-bpim-surface/50 p-10 text-center">
      <Lock className="h-8 w-8 text-bpim-muted opacity-40" />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-bold text-bpim-text">
          ログインして全機能を使おう
        </p>
        <p className="text-xs text-bpim-muted">
          {feature}を利用するにはBPIMアカウントへのログインが必要です
        </p>
      </div>
      <Button
        onClick={open}
        size="sm"
        className="rounded-full bg-bpim-primary font-bold text-bpim-bg hover:bg-bpim-primary/80"
      >
        ログインする
      </Button>
      <LoginDialog isOpen={isOpen} onClose={close} />
    </div>
  );
}
