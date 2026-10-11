"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ViewPermissionsModal from "@/components/partials/modal/ViewPermissions";
import { useTranslation } from "@/hooks/common/useTranslation";

/**
 * 「閲覧権限の管理」の説明つきセクション（タイトル・説明・管理ボタン）。ボタンで管理モーダルを開く。
 * 設定ページとプロフィール設定モーダルの両方で使う。非公開アカウントのときだけ呼び出し元が表示する。
 *
 * @param className - 外枠のスタイル（設置場所ごとの見た目に合わせる）
 */
export default function ViewPermissionsSection({
  className,
}: {
  className?: string;
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-center md:justify-between",
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-bpim-primary">
          <ShieldCheck className="h-4 w-4" />
          <span className="font-bold">{t("viewPermissions.title")}</span>
        </div>
        <p className="text-sm text-bpim-muted">
          {t("viewPermissions.section.desc")}
        </p>
      </div>
      <Button
        type="button"
        className="h-9 shrink-0 rounded-lg px-6 font-bold"
        onClick={() => setIsOpen(true)}
      >
        {t("common.manage")}
      </Button>

      <ViewPermissionsModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}
