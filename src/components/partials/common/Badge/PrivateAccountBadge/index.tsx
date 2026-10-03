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
 * 非公開アカウントを示す鍵アイコン。表示名の横に添えるインラインバッジで、アバターを置き換えるマスク表示とは別物。
 *
 * @param size - アイコンサイズ（Tailwind クラスの切り替え）
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
