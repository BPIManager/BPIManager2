import { useState } from "react";
import { DashCard } from "@/components/ui/dashcard";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useTranslation } from "@/hooks/common/useTranslation";
import CurveChart from "../CurveChart";
import FormulaCard from "../FormulaCard";
import ScoreSimulatorCard from "../ScoreSimulatorCard";
import ScoreRateTable from "../ScoreRateTable";
import type { Props } from "../types";

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
  const [songSearch, setSongSearch] = useState("");

  if (curveEligibleRows.length === 0) {
    return (
      <DashCard className="text-center text-sm text-muted-foreground">
        {t("newBpi.empty")}
      </DashCard>
    );
  }

  const query = songSearch.trim().toLowerCase();
  const filteredSongOptions = query
    ? curveEligibleRows.filter((row) => row.title.toLowerCase().includes(query))
    : curveEligibleRows;

  return (
    <div className="flex flex-col gap-4">
      <DashCard>
        <div className="mb-4 flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">{t("newBpi.chart.desc")}</p>
          <Select
            value={selectedSongId !== null ? String(selectedSongId) : undefined}
            onValueChange={(v) => onSelectedSongIdChange(Number(v))}
            onOpenChange={(open) => {
              if (!open) setSongSearch("");
            }}
          >
            <SelectTrigger size="sm" className="mt-2 w-full sm:w-80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <div className="p-1">
                <Input
                  value={songSearch}
                  onChange={(e) => setSongSearch(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder={t("newBpi.chart.songSearchPlaceholder")}
                  className="h-8"
                  autoFocus
                />
              </div>
              {filteredSongOptions.length === 0 ? (
                <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                  {t("newBpi.empty")}
                </div>
              ) : (
                filteredSongOptions.map((row) => (
                  <SelectItem key={row.songId} value={String(row.songId)}>
                    {row.title}（{row.difficultyLevel} {row.difficulty}）
                  </SelectItem>
                ))
              )}
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

export default ChartTab;
