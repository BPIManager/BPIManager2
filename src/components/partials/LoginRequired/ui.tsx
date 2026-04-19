import { LoginSection } from "../LogIn/ui";
import { cn } from "@/lib/utils";
import { LockIcon } from "lucide-react";

const LOGIN_REQUIRED_MESSAGE =
  "このコンテンツの利用にはBPIM2アカウントでのログインが必要です";

export const LoginRequiredCard = ({ className }: { className?: string }) => {
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
      <LoginSection />
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
