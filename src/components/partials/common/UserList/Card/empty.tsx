import { SearchX, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/common/useTranslation";

interface Props {
  onReset: () => void;
}

export const UserRecommendationEmpty = ({ onReset }: Props) => {
  const { t } = useTranslation();

  return (
    <div className="flex w-full flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-bpim-border bg-bpim-bg/20 py-10">
      <SearchX className="h-12 w-12 text-bpim-subtle" />
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-lg font-bold text-bpim-text tracking-tight">
          {t("rivals.search.empty.title")}
        </p>
        <p className="text-sm text-bpim-muted">
          {t("rivals.search.empty.hint")}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onReset}
        className="text-bpim-primary hover:bg-bpim-primary/10 hover:text-bpim-primary"
      >
        <RefreshCcw className="mr-2 h-4 w-4" />
        {t("rivals.search.empty.reset")}
      </Button>
    </div>
  );
};
