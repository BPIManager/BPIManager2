import { SearchX, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onReset: () => void;
}

export const UserRecommendationEmpty = ({ onReset }: Props) => {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/20 bg-bpim-bg/20 py-10">
      <SearchX className="h-12 w-12 text-bpim-subtle" />
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-lg font-bold text-bpim-text tracking-tight">
          ユーザーが見つかりませんでした
        </p>
        <p className="text-sm text-bpim-muted">
          検索ワードを短くするか、ソート条件を変えてみてください。
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onReset}
        className="text-bpim-primary hover:bg-bpim-primary/10 hover:text-bpim-primary"
      >
        <RefreshCcw className="mr-2 h-4 w-4" />
        条件をリセット
      </Button>
    </div>
  );
};
