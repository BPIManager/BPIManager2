import { useState } from "react";
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
import { SectionLoader } from "@/components/ui/loading-spinner";
import { useTranslation } from "@/hooks/common/useTranslation";
import {
  IIDX_LEVELS,
  IIDX_DIFFICULTIES,
} from "@/constants/iidx/bpiDifficulties";
import CurveChart, { CurvePoint } from "./CurveChart";
import FormulaCard, { FormulaSongInfo } from "./FormulaCard";
import ScoreSimulatorCard, {
  ScoreSimulatorSongInfo,
} from "./ScoreSimulatorCard";
import ScoreRateTable, { ScoreRateRow } from "./ScoreRateTable";
import DeltaCell from "./DeltaCell";
import UserSearchBar from "./UserSearchBar";

export type SortKey = "deltaDesc" | "deltaAsc" | "level";
export type AccessState = "loading" | "not-found" | "private" | "ok";

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
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearch: () => void;
  onReset: () => void;
  isViewingSelf: boolean;
  viewedUserName: string | null;
  accessState: AccessState;
  isDataLoading: boolean;

  rows: NewBpiRow[];
  sortKey: SortKey;
  onSortKeyChange: (key: SortKey) => void;
  currentTotalBpi: number | null;
  hybridTotalBpi: number | null;
  newTotalBpi: number | null;
  comparableCount: number;
  curveEligibleRows: NewBpiRow[];
  selectedSongId: number | null;
  onSelectedSongIdChange: (songId: number) => void;
  curveData: CurvePoint[] | null;
  scoreRateRows: ScoreRateRow[] | null;
  scoreRateMaxScore: number | null;
  selectedSongUserPoint: UserPoint | null;
  selectedSongFormula: FormulaSongInfo | null;
  selectedSongSimulator: ScoreSimulatorSongInfo | null;
  selectedSongInitialScore: number;
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

const SummaryCards = ({
  currentTotalBpi,
  hybridTotalBpi,
  newTotalBpi,
  comparableCount,
}: Pick<
  Props,
  "currentTotalBpi" | "hybridTotalBpi" | "newTotalBpi" | "comparableCount"
>) => {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          {t("newBpi.summary.hybridTotal")}
        </div>
        <div className="mt-1 text-2xl font-bold">
          {hybridTotalBpi !== null ? hybridTotalBpi.toFixed(2) : "—"}
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

type LevelFilter = "all" | 11 | 12;
type DifficultyFilter = "all" | (typeof IIDX_DIFFICULTIES)[number];

const ListTab = ({
  rows,
  sortKey,
  onSortKeyChange,
}: Pick<Props, "rows" | "sortKey" | "onSortKeyChange">) => {
  const { t } = useTranslation();
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [difficultyFilter, setDifficultyFilter] =
    useState<DifficultyFilter>("all");

  const filtered = rows.filter(
    (row) =>
      (levelFilter === "all" || row.difficultyLevel === levelFilter) &&
      (difficultyFilter === "all" || row.difficulty === difficultyFilter),
  );
  const sorted = sortRows(filtered, sortKey);

  return (
    <DashCard className="p-0">
      <div className="flex flex-wrap items-center justify-between gap-2 p-3">
        <div className="flex flex-wrap gap-2">
          <Select
            value={String(levelFilter)}
            onValueChange={(v) =>
              setLevelFilter(v === "all" ? "all" : (Number(v) as 11 | 12))
            }
          >
            <SelectTrigger size="sm" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("newBpi.filter.allLevels")}</SelectItem>
              {IIDX_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>
                  ☆{level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={difficultyFilter}
            onValueChange={(v) => setDifficultyFilter(v as DifficultyFilter)}
          >
            <SelectTrigger size="sm" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("newBpi.filter.allDifficulties")}
              </SelectItem>
              {IIDX_DIFFICULTIES.map((difficulty) => (
                <SelectItem key={difficulty} value={difficulty}>
                  {difficulty}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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

      {sorted.length === 0 ? (
        <div className="p-6 text-center text-sm text-muted-foreground">
          {t("newBpi.empty")}
        </div>
      ) : (
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
      )}
    </DashCard>
  );
};

const ChartTab = ({
  curveEligibleRows,
  selectedSongId,
  onSelectedSongIdChange,
  curveData,
  scoreRateRows,
  scoreRateMaxScore,
  selectedSongUserPoint,
  selectedSongFormula,
  selectedSongSimulator,
  selectedSongInitialScore,
}: Pick<
  Props,
  | "curveEligibleRows"
  | "selectedSongId"
  | "onSelectedSongIdChange"
  | "curveData"
  | "scoreRateRows"
  | "scoreRateMaxScore"
  | "selectedSongUserPoint"
  | "selectedSongFormula"
  | "selectedSongSimulator"
  | "selectedSongInitialScore"
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
    <div className="flex flex-col gap-4">
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

      {scoreRateRows && scoreRateMaxScore !== null && (
        <ScoreRateTable rows={scoreRateRows} maxScore={scoreRateMaxScore} />
      )}

      {selectedSongFormula && <FormulaCard {...selectedSongFormula} />}

      {selectedSongSimulator && (
        <ScoreSimulatorCard
          {...selectedSongSimulator}
          initialScore={selectedSongInitialScore}
        />
      )}
    </div>
  );
};

export default function NewBpiComparisonUi(props: Props) {
  const { t } = useTranslation();

  return (
    <>
      <PageHeader title={t("page.newBpi.title")} description={t("page.newBpi.desc")} />
      <PageContainer>
        <div className="flex flex-col gap-4">
          <UserSearchBar
            searchInput={props.searchInput}
            onSearchInputChange={props.onSearchInputChange}
            onSearch={props.onSearch}
            onReset={props.onReset}
            isViewingSelf={props.isViewingSelf}
            viewedUserName={props.viewedUserName}
          />

          {props.accessState === "not-found" && (
            <DashCard className="text-center text-sm text-muted-foreground">
              {t("newBpi.userSearch.notFound")}
            </DashCard>
          )}
          {props.accessState === "private" && (
            <DashCard className="text-center text-sm text-muted-foreground">
              {t("newBpi.userSearch.private")}
            </DashCard>
          )}
          {(props.accessState === "loading" ||
            (props.accessState === "ok" && props.isDataLoading)) && (
            <SectionLoader className="h-64 w-full" />
          )}

          {props.accessState === "ok" && !props.isDataLoading && (
            <>
              <DashCard className="border-amber-500/40 bg-amber-500/5 text-sm text-muted-foreground">
                {t("newBpi.notice")}
              </DashCard>

              <SummaryCards
                currentTotalBpi={props.currentTotalBpi}
                hybridTotalBpi={props.hybridTotalBpi}
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
                    scoreRateRows={props.scoreRateRows}
                    scoreRateMaxScore={props.scoreRateMaxScore}
                    selectedSongUserPoint={props.selectedSongUserPoint}
                    selectedSongFormula={props.selectedSongFormula}
                    selectedSongSimulator={props.selectedSongSimulator}
                    selectedSongInitialScore={props.selectedSongInitialScore}
                  />
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </PageContainer>
    </>
  );
}
