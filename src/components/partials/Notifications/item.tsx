"use client";

import Link from "next/link";
import dayjs from "@/lib/dayjs";
import { NotificationItem as NotificationItemType } from "@/hooks/users/useNotifications";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const NotificationItem = ({ n }: { n: NotificationItemType }) => {
  const isOvertaken = n.type === "overtaken";
  const diff = (n.rivalScore || 0) - (n.myScore || 0);

  return (
    <Link href={`/users/${n.senderId}`} className="block">
      <div
        className={cn(
          "flex items-center gap-3 p-3 transition-colors border-b border-bpim-border",
          "hover:bg-white/5 last:border-b-0",
        )}
      >
        <Avatar className="h-9 w-9 border border-bpim-border">
          <AvatarImage src={n.senderImage ?? ""} alt={n.senderName} />
          <AvatarFallback>{n.senderName.slice(0, 2)}</AvatarFallback>
        </Avatar>

        <div className="flex flex-1 flex-col gap-0.5 min-w-0">
          <span className="text-[10px] text-slate-500">
            {dayjs(n.timestamp).fromNow()}
          </span>

          <div className="text-sm text-slate-200 leading-snug">
            <span className="font-bold text-white">{n.senderName}</span>
            {isOvertaken ? (
              <>
                {" "}
                さんが{" "}
                <span className="font-bold text-blue-400">
                  {n.songTitle}[
                  {(n.songDifficulty || "").charAt(0).toUpperCase()}]
                </span>{" "}
                であなたを上回りました
                <div className="mt-1 flex items-center gap-2 text-xs text-blue-300/80">
                  <span>あなた:{n.myScore || 0}</span>
                  <span>ライバル:{n.rivalScore || 0}</span>
                  <Badge
                    variant="destructive"
                    className="h-4 px-1.5 text-[10px] font-bold"
                  >
                    -{diff}
                  </Badge>
                </div>
              </>
            ) : (
              " さんにフォローされました"
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};
