import { LoginPageBody } from "../LogIn/ui";
import { cn } from "@/lib/utils";
import { LockIcon } from "lucide-react";
import { LoginButtons } from "../LogIn";

const LOGIN_REQUIRED_MESSAGE =
  "このコンテンツの利用にはBPIM2アカウントでのログインが必要です";

export const LoginRequiredCard = ({
  className,
  isModal,
}: {
  className?: string;
  isModal?: boolean;
}) => {
  if (isModal) {
    return (
      <div
        className={cn(
          "relative flex flex-col items-center overflow-hidden rounded-xl border border-bpim-border bg-bpim-bg p-8 text-center",
          className,
        )}
      >
        <LockIcon
          className="pointer-events-none absolute -right-2 -top-2 rotate-12 text-[120px] text-bpim-text/5"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-blue-500/20 bg-bpim-primary/10 text-bpim-primary">
            <LockIcon size={32} />
          </div>

          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-bold text-bpim-text">
              ログインが必要です
            </h3>
            <p className="max-w-70 text-sm text-bpim-muted">
              このコンテンツの利用には、BPIMアカウントへのログインが必要です。
            </p>
          </div>

          <div className="w-full min-w-70">
            <LoginButtons />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div
      className={cn(
        "rounded-2xl border border-bpim-border bg-bpim-bg p-6 shadow-xl",
        className,
      )}
    >
      <div className="mb-5 flex items-start gap-3 rounded-xl border border-bpim-primary/30 bg-bpim-primary/8 px-4 py-3 text-bpim-primary">
        <LockIcon className="mt-0.5 h-4 w-4 shrink-0" />
        <span className="text-sm font-medium">{LOGIN_REQUIRED_MESSAGE}</span>
      </div>
      <LoginPageBody />
    </div>
  );
};

export const LoginRequiredBox = () => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
      <LoginRequiredCard className="w-full max-w-sm" />
    </div>
  );
};
