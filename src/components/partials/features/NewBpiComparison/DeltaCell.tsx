import { useTranslation } from "@/hooks/common/useTranslation";
import { cn } from "@/lib/utils";

/** 新方式BPI−現行BPIの差分を色付きで表示する。値はBPIそのものの差分。 */
export default function DeltaCell({ delta }: { delta: number | null }) {
  const { t } = useTranslation();
  if (delta === null) {
    return <span className="text-muted-foreground">{t("newBpi.table.noParam")}</span>;
  }
  return (
    <span
      className={cn(
        "font-medium",
        delta > 0 && "text-emerald-600 dark:text-emerald-400",
        delta < 0 && "text-rose-600 dark:text-rose-400",
      )}
    >
      {delta > 0 ? "+" : ""}
      {delta.toFixed(2)}
    </span>
  );
}
