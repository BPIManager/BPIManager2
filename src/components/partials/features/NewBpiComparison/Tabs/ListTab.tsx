import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
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
import { useTranslation } from "@/hooks/common/useTranslation";
import {
  IIDX_LEVELS,
  IIDX_DIFFICULTIES,
} from "@/constants/iidx/bpiDifficulties";
import { RADAR_COLORS } from "@/constants/iidx/radars";
import RadarSection from "@/components/partials/common/Songs/AdvancedFilter/RadarSection";
import BpmSection from "@/components/partials/common/Songs/AdvancedFilter/BpmSection";
import CurveChart from "../CurveChart";
import ScoreRateTable from "../ScoreRateTable";
import SongParamsPanel from "../SongParamsPanel";
import DeltaCell from "../DeltaCell";
import ListSummary from "../ListSummary";
import { RadarComparisonCard } from "../sections";
import type { NewBpiRow, Props, SortKey } from "../types";

type LevelFilter = "all" | 11 | 12;
type DifficultyFilter = "all" | (typeof IIDX_DIFFICULTIES)[number];

const sortRows = (rows: NewBpiRow[], key: SortKey): NewBpiRow[] => {
  const sorted = [...rows];
  switch (key) {
    case "deltaDesc":
      return sorted.sort((a, b) => (b.delta ?? -Infinity) - (a.delta ?? -Infinity));
    case "deltaAsc":
      return sorted.sort((a, b) => (a.delta ?? Infinity) - (b.delta ?? Infinity));
    case "level":
      return sorted.sort((a, b) => b.difficultyLevel - a.difficultyLevel);
    case "currentBpiDesc":
      return sorted.sort((a, b) => (b.currentBpi ?? -Infinity) - (a.currentBpi ?? -Infinity));
    case "newBpiDesc":
      return sorted.sort((a, b) => (b.newBpi ?? -Infinity) - (a.newBpi ?? -Infinity));
  }
};

const ListTab = ({
  rows,
  sortKey,
  onSortKeyChange,
  radarCurrent,
  radarNew,
  listExpandedSongId,
  onToggleListSong,
  selectedSongParams,
  curveData,
  scoreRateRows,
  scoreRateMaxScore,
  selectedSongUserPoint,
}: Pick<
  Props,
  | "rows"
  | "sortKey"
  | "onSortKeyChange"
  | "radarCurrent"
  | "radarNew"
  | "listExpandedSongId"
  | "onToggleListSong"
  | "selectedSongParams"
  | "curveData"
  | "scoreRateRows"
  | "scoreRateMaxScore"
  | "selectedSongUserPoint"
>) => {
  const { t } = useTranslation();
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [difficultyFilter, setDifficultyFilter] =
    useState<DifficultyFilter>("all");
  const [radarCats, setRadarCats] = useState<string[]>([]);
  const [bpmMin, setBpmMin] = useState<number | undefined>(undefined);
  const [bpmMax, setBpmMax] = useState<number | undefined>(undefined);
  const [isSofran, setIsSofran] = useState<boolean | undefined>(undefined);

  const filtered = rows.filter(
    (row) =>
      (levelFilter === "all" || row.difficultyLevel === levelFilter) &&
      (difficultyFilter === "all" || row.difficulty === difficultyFilter) &&
      (radarCats.length === 0 ||
        (row.radarTop !== null && radarCats.includes(row.radarTop))) &&
      (bpmMin === undefined || (row.bpmHi !== null && row.bpmHi >= bpmMin)) &&
      (bpmMax === undefined || (row.bpmLo !== null && row.bpmLo <= bpmMax)) &&
      (!isSofran ||
        (row.bpmLo !== null &&
          row.bpmHi !== null &&
          row.bpmLo !== row.bpmHi)),
  );
  const sorted = sortRows(filtered, sortKey);

  return (
    <div className="flex flex-col gap-4">
      <ListSummary rows={filtered} />
      <RadarComparisonCard radarCurrent={radarCurrent} radarNew={radarNew} />

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
              <SelectItem value="currentBpiDesc">{t("newBpi.sort.currentBpiDesc")}</SelectItem>
              <SelectItem value="newBpiDesc">{t("newBpi.sort.newBpiDesc")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 border-t border-bpim-border/60 p-3 sm:grid-cols-2">
          <RadarSection
            radarCategories={radarCats}
            onChange={(v) => {
              if (v.radarCategories !== undefined)
                setRadarCats(v.radarCategories);
            }}
          />
          <BpmSection
            bpmMin={bpmMin}
            bpmMax={bpmMax}
            isSofran={isSofran}
            onChange={(v) => {
              if ("bpmMin" in v) setBpmMin(v.bpmMin);
              if ("bpmMax" in v) setBpmMax(v.bpmMax);
              if ("isSofran" in v) setIsSofran(v.isSofran);
            }}
          />
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
                <TableHead>{t("newBpi.table.radar")}</TableHead>
                <TableHead>{t("newBpi.table.level")}</TableHead>
                <TableHead className="text-right">{t("newBpi.table.exScore")}</TableHead>
                <TableHead className="text-right">{t("newBpi.table.currentBpi")}</TableHead>
                <TableHead className="text-right">{t("newBpi.table.newBpi")}</TableHead>
                <TableHead className="text-right">{t("newBpi.table.delta")}</TableHead>
                <TableHead className="text-right">{t("newBpi.table.estimatedRank")}</TableHead>
                <TableHead className="text-right">{t("newBpi.table.actualRank")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((row) => {
                const isExpanded = listExpandedSongId === row.songId;
                return (
                  <Fragment key={row.songId}>
                    <TableRow
                      aria-expanded={isExpanded}
                      tabIndex={0}
                      onClick={() => onToggleListSong(row.songId)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onToggleListSong(row.songId);
                        }
                      }}
                      className={`cursor-pointer ${
                        isExpanded ? "bg-bpim-bg/40" : ""
                      }`}
                    >
                      <TableCell className="max-w-60 truncate font-medium">
                        <span className="mr-1 inline-flex align-middle text-muted-foreground">
                          {isExpanded ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                          )}
                        </span>
                        {row.title}
                      </TableCell>
                      <TableCell>
                        {row.radarTop ? (
                          <span
                            className="text-xs font-bold"
                            style={{
                              color:
                                RADAR_COLORS[
                                  row.radarTop as keyof typeof RADAR_COLORS
                                ],
                            }}
                          >
                            {row.radarTop}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {row.difficultyLevel} {row.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.exScore}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.currentBpi !== null ? row.currentBpi.toFixed(2) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.newBpi !== null
                          ? row.newBpi.toFixed(2)
                          : t("newBpi.table.noParam")}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <DeltaCell delta={row.delta} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {row.estimatedRank !== null
                          ? `#${row.estimatedRank.toLocaleString()}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {row.actualRank !== null
                          ? `#${row.actualRank.toLocaleString()}${
                              row.actualTotalPlayers !== null
                                ? ` / ${row.actualTotalPlayers.toLocaleString()}`
                                : ""
                            }`
                          : "—"}
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={9} className="bg-bpim-bg/40 p-3">
                          <div className="flex flex-col gap-4">
                            {selectedSongParams && (
                              <SongParamsPanel {...selectedSongParams} />
                            )}
                            {curveData && (
                              <DashCard>
                                <p className="mb-2 text-xs text-muted-foreground">
                                  {t("newBpi.chart.desc")}
                                </p>
                                <CurveChart
                                  data={curveData}
                                  userPoint={selectedSongUserPoint}
                                />
                              </DashCard>
                            )}
                            {scoreRateRows && scoreRateMaxScore !== null && (
                              <ScoreRateTable
                                rows={scoreRateRows}
                                maxScore={scoreRateMaxScore}
                              />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        )}
      </DashCard>
    </div>
  );
};

export default ListTab;
