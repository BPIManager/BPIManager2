import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PublicLogsCardProps {
  /** 本人が閲覧している場合はtrue。カード枠を出さず素の表示にする */
  isOwnProfile?: boolean;
  children: ReactNode;
}

/**
 * ログ一覧・ログ詳細(日次/週次/月次/バージョン/バッチ)ページで共通の
 * 「他人のプロフィールから見た場合だけカード枠で囲む」表示を共通化したもの。
 */
export const PublicLogsCard = ({
  isOwnProfile = false,
  children,
}: PublicLogsCardProps) => (
  <div
    className={cn(
      "rounded-2xl transition-all",
      isOwnProfile
        ? "bg-transparent p-0"
        : "border border-bpim-border bg-bpim-bg/40 p-4 shadow-xl backdrop-blur-md md:p-6",
    )}
  >
    {children}
  </div>
);
