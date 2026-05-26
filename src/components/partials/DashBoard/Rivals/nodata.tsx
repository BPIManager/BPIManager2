import { DashCard } from "@/components/ui/dashcard";
import { UserPlus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/common/useTranslation";

export const RivalWinLossSummaryNotFound = () => {
  const { t } = useTranslation();
  return (
    <DashCard className="flex flex-col items-center justify-center gap-4 p-8">
      <UserPlus className="h-10 w-10 text-bpim-muted" />
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="font-bold text-bpim-text">{t("dashboard.rivals.noRivals")}</p>
        <p className="text-xs text-bpim-muted">
          {t("dashboard.rivals.noRivalsDesc")}
        </p>
      </div>
      <Button
        asChild
        variant="outline"
        size="sm"
        className="mt-2 border-yellow-500/50 bg-yellow-500/10 px-4 text-yellow-500 transition-colors hover:bg-yellow-500/20 hover:text-yellow-400"
      >
        <Link href="/rivals/search">{t("dashboard.rivals.findSimilar")}</Link>
      </Button>
    </DashCard>
  );
};
