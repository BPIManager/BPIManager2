"use client";

import type { ReactNode } from "react";
import dayjs from "@/lib/dayjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/** 閲覧権限の管理モーダルの1行（アバター・名前・補足の日時・操作ボタン） */
export const PermissionRow = ({
  name,
  image,
  date,
  actions,
}: {
  name: string;
  image: string | null;
  /** 申請日時または承認日時 */
  date: string;
  actions: ReactNode;
}) => (
  <div className="flex items-center gap-3 border-b border-bpim-border p-3 last:border-b-0">
    <Avatar className="h-9 w-9 shrink-0 border border-bpim-border">
      <AvatarImage src={image ?? ""} alt={name} />
      <AvatarFallback>{name.slice(0, 2)}</AvatarFallback>
    </Avatar>
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="truncate text-sm font-bold text-bpim-text">{name}</span>
      <span className="text-[10px] text-bpim-muted">
        {dayjs(date).fromNow()}
      </span>
    </div>
    <div className="flex shrink-0 gap-2">{actions}</div>
  </div>
);
