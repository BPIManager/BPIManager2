import { DashCard } from "@/components/ui/dashcard";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageContainer, PageHeader } from "@/components/partials/common/PageChrome/Header";
import { useTranslation } from "@/hooks/common/useTranslation";
import { cn } from "@/lib/utils";
import CurveChart, { CurvePoint } from "./CurveChart";

export type SortKey = "deltaDesc" | "deltaAsc" | "level";

export interface NewBpiRow {
  songId: number;
  title: string;
  difficulty: string;
  difficultyLevel: number;
  exScore: number;
  currentBpi: number | null;
  newBpi: number | null;
  delta: number | null;
}

interface UserPoint {
  exScore: number;
  currentBpi: number | null;
  newBpi: number | null;
}

interface Props {
  rows: NewBpiRow[];
  sortKey: SortKey;
  onSortKeyChange: (key: SortKey) => void;
  currentTotalBpi: number | null;
  newTotalBpi: number | null;
  comparableCount: number;
  curveEligibleRows: NewBpiRow[];
  selectedSongId: number | null;
  onSelectedSongIdChange: (songId: number) => void;
  curveData: CurvePoint[] | null;
  selectedSongUserPoint: UserPoint | null;
}

const sortRows = (rows: NewBpiRow[], key: SortKey): NewBpiRow[] => {
  const sorted = [...rows];
  switch (key) {
    case "deltaDesc":
      return sorted.sort((a, b) => (b.delta ?? -Infinity) - (a.delta ?? -Infinity));
    case "deltaAsc":
      return sorted.sort((a, b) => (a.delta ?? Infinity) - (b.delta ?? Infinity));
    case "level":
      return sorted.sort((a, b) => b.difficultyLevel - a.difficultyLevel);
  }
};

const DeltaCell = ({ delta }: { delta: number | null }) => {
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
};

const SummaryCards = ({
  currentTotalBpi,
  newTotalBpi,
  comparableCount,
}: Pick<Props, "currentTotalBpi" | "newTotalBpi" | "comparableCount">) => {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <DashCard>
        <div className="text-xs text-muted-foreground">
          {t("newBpi.summary.currentTotal")}
        </div>
        <div className="mt-1 text-2xl font-bold">
          {currentTotalBpi !== null ? currentTotalBpi.toFixed(2) : "—"}
        </div>
      </DashCard>
      <DashCard>
        <div className="text-xs text-muted-foreground">
          {t("newBpi.summary.newTotal")}
        </div>
        <div className="mt-1 text-2xl font-bold">
          {newTotalBpi !== null ? newTotalBpi.toFixed(2) : "—"}
        </div>
      </DashCard>
      <DashCard>
        <div className="text-xs text-muted-foreground">
          {t("newBpi.summary.songCount")}
        </div>
        <div className="mt-1 text-2xl font-bold">{comparableCount}</div>
      </DashCard>
    </div>
  );
};

const ListTab = ({
  rows,
  sortKey,
  onSortKeyChange,
}: Pick<Props, "rows" | "sortKey" | "onSortKeyChange">) => {
  const { t } = useTranslation();
  const sorted = sortRows(rows, sortKey);

  if (rows.length === 0) {
    return (
      <DashCard className="text-center text-sm text-muted-foreground">
        {t("newBpi.empty")}
      </DashCard>
    );
  }

  return (
    <DashCard className="p-0">
      <div className="flex items-center justify-end p-3">
        <Select value={sortKey} onValueChange={(v) => onSortKeyChange(v as SortKey)}>
          <SelectTrigger size="sm" className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="deltaDesc">{t("newBpi.sort.deltaDesc")}</SelectItem>
            <SelectItem value="deltaAsc">{t("newBpi.sort.deltaAsc")}</SelectItem>
            <SelectItem value="level">{t("newBpi.sort.level")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("newBpi.table.song")}</TableHead>
            <TableHead>{t("newBpi.table.level")}</TableHead>
            <TableHead className="text-right">{t("newBpi.table.exScore")}</TableHead>
            <TableHead className="text-right">{t("newBpi.table.currentBpi")}</TableHead>
            <TableHead className="text-right">{t("newBpi.table.newBpi")}</TableHead>
            <TableHead className="text-right">{t("newBpi.table.delta")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((row) => (
            <TableRow key={row.songId}>
              <TableCell className="max-w-60 truncate font-medium">
                {row.title}
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {row.difficultyLevel} {row.difficulty}
                </Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums">{row.exScore}</TableCell>
              <TableCell className="text-right tabular-nums">
                {row.currentBpi !== null ? row.currentBpi.toFixed(2) : "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.newBpi !== null ? row.newBpi.toFixed(2) : t("newBpi.table.noParam")}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                <DeltaCell delta={row.delta} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DashCard>
  );
};

const ChartTab = ({
  curveEligibleRows,
  selectedSongId,
  onSelectedSongIdChange,
  curveData,
  selectedSongUserPoint,
}: Pick<
  Props,
  | "curveEligibleRows"
  | "selectedSongId"
  | "onSelectedSongIdChange"
  | "curveData"
  | "selectedSongUserPoint"
>) => {
  const { t } = useTranslation();

  if (curveEligibleRows.length === 0) {
    return (
      <DashCard className="text-center text-sm text-muted-foreground">
        {t("newBpi.empty")}
      </DashCard>
    );
  }

  return (
    <DashCard>
      <div className="mb-4 flex flex-col gap-1">
        <p className="text-xs text-muted-foreground">{t("newBpi.chart.desc")}</p>
        <Select
          value={selectedSongId !== null ? String(selectedSongId) : undefined}
          onValueChange={(v) => onSelectedSongIdChange(Number(v))}
        >
          <SelectTrigger size="sm" className="mt-2 w-full sm:w-80">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {curveEligibleRows.map((row) => (
              <SelectItem key={row.songId} value={String(row.songId)}>
                {row.title}（{row.difficultyLevel} {row.difficulty}）
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {curveData && (
        <CurveChart data={curveData} userPoint={selectedSongUserPoint} />
      )}
    </DashCard>
  );
};

export default function NewBpiComparisonUi(props: Props) {
  const { t } = useTranslation();

  return (
    <>
      <PageHeader title={t("page.newBpi.title")} description={t("page.newBpi.desc")} />
      <PageContainer>
        <div className="flex flex-col gap-4">
          <DashCard className="border-amber-500/40 bg-amber-500/5 text-sm text-muted-foreground">
            {t("newBpi.notice")}
          </DashCard>

          <SummaryCards
            currentTotalBpi={props.currentTotalBpi}
            newTotalBpi={props.newTotalBpi}
            comparableCount={props.comparableCount}
          />

          <Tabs defaultValue="list">
            <TabsList className="w-fit">
              <TabsTrigger value="list">{t("newBpi.tab.list")}</TabsTrigger>
              <TabsTrigger value="chart">{t("newBpi.tab.chart")}</TabsTrigger>
            </TabsList>
            <TabsContent value="list">
              <ListTab
                rows={props.rows}
                sortKey={props.sortKey}
                onSortKeyChange={props.onSortKeyChange}
              />
            </TabsContent>
            <TabsContent value="chart">
              <ChartTab
                curveEligibleRows={props.curveEligibleRows}
                selectedSongId={props.selectedSongId}
                onSelectedSongIdChange={props.onSelectedSongIdChange}
                curveData={props.curveData}
                selectedSongUserPoint={props.selectedSongUserPoint}
              />
            </TabsContent>
          </Tabs>
        </div>
      </PageContainer>
    </>
  );
}
