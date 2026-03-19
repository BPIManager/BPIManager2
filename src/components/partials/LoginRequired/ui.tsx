import { LoginButtons } from "../LogIn";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export const LoginRequiredCard = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center overflow-hidden rounded-xl border border-bpim-border bg-bpim-bg p-8 text-center",
        className,
      )}
    >
      <Lock
        className="pointer-events-none absolute -right-2 -top-2 rotate-12 text-[120px] text-bpim-text/5"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-blue-500/20 bg-bpim-primary/10 text-bpim-primary">
          <Lock size={32} />
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-bold text-bpim-text">
            ログインが必要です
          </h3>
          <p className="max-w-[280px] text-sm text-bpim-muted">
            このコンテンツの利用には、BPIMアカウントへのログインが必要です。
          </p>
        </div>

        <div className="w-full min-w-[280px]">
          <LoginButtons />
        </div>
      </div>
    </div>
  );
};

export const LoginRequiredBox = () => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-bpim-bg/40 backdrop-blur-md"
        aria-hidden="true"
      />

      <div className="relative z-20 w-full max-w-md">
        <LoginRequiredCard />
      </div>
    </div>
  );
};
