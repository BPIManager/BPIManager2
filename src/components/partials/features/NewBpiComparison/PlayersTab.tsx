import { useState } from "react";
import { DashCard } from "@/components/ui/dashcard";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { SectionLoader } from "@/components/ui/loading-spinner";
import { useTranslation } from "@/hooks/common/useTranslation";
import { usePlayersList } from "@/hooks/newBpi/usePlayersList";
import DeltaCell from "./DeltaCell";

const PAGE_SIZE = 20;

/**
 * issue #299〜304検証用「全プレイヤー」一覧。公開ユーザーをページ単位で
 * 列挙し、総合BPI(現行/単曲のみ新方式/単曲・総合とも新方式)の変化と
 * 単曲の増減数を1行1ユーザーで表示する。
 *
 * ページごとにサーバー側でBPIを再計算するため({@link usePlayersList}参照)、
 * 一度に全公開ユーザー分の計算は行わない。
 */
export default function PlayersTab() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const { players, totalCount, isLoading, isError } = usePlayersList(
    page,
    PAGE_SIZE,
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  if (isError) {
    return (
      <DashCard className="text-center text-sm text-muted-foreground">
        {t("newBpi.players.error")}
      </DashCard>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <DashCard className="p-0">
        <div className="flex items-center justify-between p-3">
          <p className="text-xs text-muted-foreground">
            {t("newBpi.players.desc")}
          </p>
          <span className="text-xs text-muted-foreground">
            {totalCount}
            {t("newBpi.players.countUnit")}
          </span>
        </div>

        {isLoading ? (
          <SectionLoader className="h-64 w-full" />
        ) : players.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            {t("newBpi.empty")}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("newBpi.players.user")}</TableHead>
                <TableHead className="text-right">
                  {t("newBpi.summary.currentTotal")}
                </TableHead>
                <TableHead className="text-right">
                  {t("newBpi.players.hybridDelta")}
                </TableHead>
                <TableHead className="text-right">
                  {t("newBpi.players.fullDelta")}
                </TableHead>
                <TableHead className="text-right">
                  {t("newBpi.players.increaseCount")}
                </TableHead>
                <TableHead className="text-right">
                  {t("newBpi.players.decreaseCount")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((p) => (
                <TableRow key={p.userId}>
                  <TableCell className="max-w-40 truncate font-medium">
                    {p.userName}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.currentTotal.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <DeltaCell delta={p.hybridTotal - p.currentTotal} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <DeltaCell
                      delta={
                        p.fullNewTotal !== null
                          ? p.fullNewTotal - p.currentTotal
                          : null
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                    {p.increaseCount}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-rose-600 dark:text-rose-400">
                    {p.decreaseCount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DashCard>

      <div className="flex items-center justify-center gap-3">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1 || isLoading}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          {t("newBpi.players.prevPage")}
        </Button>
        <span className="text-xs text-muted-foreground">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages || isLoading}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          {t("newBpi.players.nextPage")}
        </Button>
      </div>
    </div>
  );
}
