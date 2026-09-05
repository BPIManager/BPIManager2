import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { DashCard } from "@/components/ui/dashcard";
import { useTranslation } from "@/hooks/common/useTranslation";
import DeltaCell from "./DeltaCell";

export interface ScoreRateRow {
  /** スコアレート(%)。下限行はBPI0相当(皆伝平均)のレート。 */
  rate: number;
  /** 下限行(BPI0相当)かどうか */
  isBpi0Anchor: boolean;
  exScore: number;
  current: number | null;
  new: number | null;
}

/** 90%未満は小数まで、90%以降(1%刻み・0.5%刻み)は整数部+必要な分だけ表示する。 */
const formatRate = (rate: number) => {
  const rounded = Math.round(rate * 100) / 100;
  return Number.isInteger(rounded) ? `${rounded}` : `${rounded.toFixed(2).replace(/0$/, "")}`;
};

export default function ScoreRateTable({ rows }: { rows: ScoreRateRow[] }) {
  const { t } = useTranslation();
  return (
    <DashCard className="p-0">
      <h3 className="p-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {t("newBpi.chart.tableTitle")}
      </h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("newBpi.chart.table.scoreRate")}</TableHead>
            <TableHead className="text-right">{t("newBpi.table.exScore")}</TableHead>
            <TableHead className="text-right">{t("newBpi.table.currentBpi")}</TableHead>
            <TableHead className="text-right">{t("newBpi.table.newBpi")}</TableHead>
            <TableHead className="text-right">{t("newBpi.table.delta")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.rate}>
              <TableCell className="font-medium">
                {formatRate(row.rate)}%
                {row.isBpi0Anchor && (
                  <span className="ml-1 text-[10px] text-muted-foreground">
                    ({t("newBpi.chart.table.bpi0Anchor")})
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">{row.exScore}</TableCell>
              <TableCell className="text-right tabular-nums">
                {row.current !== null ? row.current.toFixed(2) : "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.new !== null ? row.new.toFixed(2) : t("newBpi.table.noParam")}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                <DeltaCell
                  delta={
                    row.current !== null && row.new !== null
                      ? row.new - row.current
                      : null
                  }
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DashCard>
  );
}
