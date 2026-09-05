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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { SectionLoader } from "@/components/ui/loading-spinner";
import { useTranslation } from "@/hooks/common/useTranslation";
import { usePlayersList, PlayersListBpiFilter } from "@/hooks/newBpi/usePlayersList";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

/** 現行総合BPIの絞り込みバケット。-15(床)〜100を10刻み、100+は上限なし。 */
const BPI_BUCKETS: { key: string; min?: number; max?: number }[] = [
  { key: "all" },
  { key: "-15~0", min: -15, max: 0 },
  ...Array.from({ length: 10 }, (_, i) => ({
    key: `${i * 10}~${(i + 1) * 10}`,
    min: i * 10,
    max: (i + 1) * 10,
  })),
  { key: "100+", min: 100 },
];

/** 変化先の値を表示し、差分を括弧書きで併記するセル。 */
const ValueWithDeltaCell = ({
  value,
  delta,
}: {
  value: number | null;
  delta: number | null;
}) => {
  if (value === null) return <span className="text-muted-foreground">—</span>;
  return (
    <span>
      {value.toFixed(2)}
      {delta !== null && (
        <span
          className={cn(
            "ml-1 text-xs",
            delta > 0.005 && "text-emerald-600 dark:text-emerald-400",
            delta < -0.005 && "text-rose-600 dark:text-rose-400",
            Math.abs(delta) <= 0.005 && "text-muted-foreground",
          )}
        >
          ({delta > 0 ? "+" : ""}
          {delta.toFixed(2)})
        </span>
      )}
    </span>
  );
};

/**
 * issue #299〜304検証用「全プレイヤー」一覧。公開ユーザー(☆12のスコアが
 * 1曲以上ある人のみ)を現行総合BPIが高い順にページ単位で列挙し、総合BPI
 * (現行/単曲のみ新方式/単曲・総合とも新方式)の変化と単曲の増減数を
 * 1行1ユーザーで表示する。
 *
 * ページごとにサーバー側でBPIを再計算するため({@link usePlayersList}参照)、
 * 一度に全公開ユーザー分の計算は行わない。
 */
export default function PlayersTab() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [bucketKey, setBucketKey] = useState("all");

  const bucket = BPI_BUCKETS.find((b) => b.key === bucketKey);
  const bpiFilter: PlayersListBpiFilter | undefined =
    bucket && bucket.key !== "all" ? { min: bucket.min, max: bucket.max } : undefined;

  const { players, totalCount, isLoading, isError } = usePlayersList(
    page,
    PAGE_SIZE,
    bpiFilter,
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
      <DashCard className="text-xs text-muted-foreground">
        {t("newBpi.players.privacyNotice")}
      </DashCard>

      <DashCard className="p-0">
        <div className="flex flex-wrap items-center gap-2 p-3">
          <p className="text-xs text-muted-foreground">
            {t("newBpi.players.desc")}
          </p>
          <Select
            value={bucketKey}
            onValueChange={(v) => {
              setBucketKey(v);
              setPage(1);
            }}
          >
            <SelectTrigger size="sm" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("newBpi.players.allBpi")}</SelectItem>
              {BPI_BUCKETS.filter((b) => b.key !== "all").map((b) => (
                <SelectItem key={b.key} value={b.key}>
                  {b.key}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                  {t("newBpi.summary.hybridTotal")}
                </TableHead>
                <TableHead className="text-right">
                  {t("newBpi.summary.newTotal")}
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
                    <ValueWithDeltaCell
                      value={p.hybridTotal}
                      delta={p.hybridTotal - p.currentTotal}
                    />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <ValueWithDeltaCell
                      value={p.fullNewTotal}
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
