import { LuLock, LuUserMinus } from "react-icons/lu";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const ProfileErrorState = ({
  type,
}: {
  type: "private" | "notfound" | "error";
}) => {
  const configs = {
    private: {
      title: "非公開のプロフィール",
      desc: "このユーザーはプロフィールを非公開に設定しています。",
      icon: <LuLock size={48} />,
      color: "text-bpim-warning",
    },
    notfound: {
      title: "ユーザーが見つかりません",
      desc: "指定されたIDのユーザーは存在しないか、退会した可能性があります。",
      icon: <LuUserMinus size={48} />,
      color: "text-bpim-muted",
    },
    error: {
      title: "エラーが発生しました",
      desc: "データの取得中に問題が発生しました。再度お試しください。",
      icon: <AlertTriangle size={48} />,
      color: "text-bpim-danger",
    },
  };
  const current = configs[type];

  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <div className={cn("rounded-full bg-white/5 p-6", current.color)}>
        {current.icon}
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-bpim-text tracking-tight">
          {current.title}
        </h2>
        <p className="max-w-[320px] text-sm text-bpim-muted leading-relaxed">
          {current.desc}
        </p>
      </div>
      <Button
        asChild
        variant="outline"
        size="sm"
        className="mt-4 px-6 border-bpim-border hover:bg-bpim-overlay/50"
      >
        <Link href="/">トップページへ戻る</Link>
      </Button>
    </div>
  );
};
