import { LuLock } from "react-icons/lu";
import { LoginButtons } from "../LogIn";
import { cn } from "@/lib/utils";

export const LoginRequiredCard = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center overflow-hidden rounded-xl border border-bpim-border bg-bpim-bg p-8 text-center",
        className,
      )}
    >
      <LuLock
        className="pointer-events-none absolute -right-2 -top-2 rotate-12 text-[120px] text-white/5"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400">
          <LuLock size={32} />
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-bold text-white">ログインが必要です</h3>
          <p className="max-w-[280px] text-sm text-gray-400">
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
