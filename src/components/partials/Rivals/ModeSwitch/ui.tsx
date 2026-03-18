import { Swords, User, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ModeSwitchBannerProps {
  type: "user" | "rival";
  targetUserId: string;
  isMe: boolean;
}

export const ModeSwitchBanner = ({
  type,
  targetUserId,
  isMe,
}: ModeSwitchBannerProps) => {
  if (isMe) return null;

  const isRivalMode = type === "rival";

  return (
    <div
      className={cn(
        "mb-4 flex flex-wrap items-center gap-4 rounded-lg border p-3",
        isRivalMode
          ? "border-orange-500/30 bg-orange-500/10"
          : "border-blue-500/30 bg-blue-500/10",
      )}
    >
      <div className="flex flex-1 items-center gap-2 min-w-fit">
        <Swords
          className={cn(
            "h-4 w-4",
            isRivalMode ? "text-orange-500" : "text-gray-200",
          )}
        />
        <span
          className={cn(
            "text-xs font-bold whitespace-nowrap",
            isRivalMode ? "text-orange-300" : "text-blue-300",
          )}
        >
          {isRivalMode ? "ライバル比較モード" : "スコアを比較しますか?"}
        </span>
      </div>

      <Button
        asChild
        variant="outline"
        size="xs"
        className={cn(
          "h-7 px-2 font-bold transition-all",
          isRivalMode
            ? "border-orange-500/50 text-orange-400 hover:bg-orange-500/20"
            : "border-blue-500/50 text-blue-400 hover:bg-blue-500/20",
        )}
      >
        <Link
          href={
            isRivalMode ? `/users/${targetUserId}` : `/rivals/${targetUserId}`
          }
        >
          {isRivalMode ? (
            <User className="mr-1 h-3.5 w-3.5" />
          ) : (
            <Swords className="mr-1 h-3.5 w-3.5" />
          )}
          <span>{isRivalMode ? "プロフィールを表示" : "スコア比較モード"}</span>
          <ChevronRight className="ml-1 h-3.5 w-3.5" />
        </Link>
      </Button>
    </div>
  );
};
