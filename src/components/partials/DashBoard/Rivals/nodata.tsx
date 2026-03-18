import { DashCard } from "@/components/ui/dashcard";
import { UserPlus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const RivalWinLossSummaryNotFound = () => {
  return (
    <DashCard className="flex flex-col items-center justify-center gap-4 p-8">
      <UserPlus className="h-10 w-10 text-gray-500" />
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="font-bold text-white">比較対象のライバルがいません</p>
        <p className="text-xs text-gray-500">
          実力が近いユーザーをライバルに登録してスコアを比較できます！
        </p>
      </div>
      <Button
        asChild
        variant="outline"
        size="sm"
        className="mt-2 border-yellow-500/50 bg-yellow-500/10 px-4 text-yellow-500 transition-colors hover:bg-yellow-500/20 hover:text-yellow-400"
      >
        <Link href="/rivals/search">実力が近いユーザーを見る</Link>
      </Button>
    </DashCard>
  );
};
