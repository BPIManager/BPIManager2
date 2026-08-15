import { Lock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "@/hooks/common/useTranslation";
import { cn } from "@/lib/utils";

/**
 * 非公開アカウントであることを示す鍵アイコン。
 *
 * マスク表示（`Ranking/row.tsx`等の`Lock`アイコンはアバター自体を
 * 置き換える）とは異なり、こちらは表示名の横に添えるインラインの
 * ステータスバッジ。表示名自体は既に閲覧許可がある（プロフィール
 * ページ本人表示・承認済みフォロワー等）ことが前提。
 *
 * @param size - アイコンサイズ（px相当のTailwindクラス切り替え）
 */
const PrivateAccountBadge = ({
  size = "sm",
  className,
}: {
  size?: "sm" | "xs";
  className?: string;
}) => {
  const { t } = useTranslation();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Lock
            className={cn(
              "shrink-0 text-bpim-muted",
              size === "xs" ? "h-3 w-3" : "h-3.5 w-3.5",
              className,
            )}
            aria-label={t("common.privateAccount")}
          />
        </TooltipTrigger>
        <TooltipContent>{t("common.privateAccount")}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default PrivateAccountBadge;
