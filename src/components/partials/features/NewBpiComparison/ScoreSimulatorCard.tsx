import { useState } from "react";
import { BpiV1 } from "@bpim/bpicalc";
import { DashCard } from "@/components/ui/dashcard";
import { Input } from "@/components/ui/input";
import { BpiCalculator } from "@/lib/bpi";
import { useTranslation } from "@/hooks/common/useTranslation";

export interface ScoreSimulatorSongInfo {
  notes: number;
  kaidenAvg: number | null;
  wrScore: number | null;
  coef: number | null;
  /** V2(分布ベース)算出用。ALS対象外・未計算の曲は null */
  mu: number | null;
  sigma: number | null;
  residualVar: number | null;
  hasNewParams: boolean;
}

interface Props extends ScoreSimulatorSongInfo {
  initialScore: number;
}

// 「現行(V1)」は本番実装(BpiCalculator、現在はV2)ではなくレガシーのV1公式を
// 直接使う（比較ページの他の箇所と同じ理由。index.tsx参照）。
const legacyV1 = new BpiV1();

/**
 * EXスコアを入力すると、この楽曲の現行BPI・新BPIをその場で計算して表示する。
 */
export default function ScoreSimulatorCard({
  notes,
  kaidenAvg,
  wrScore,
  coef,
  mu,
  sigma,
  residualVar,
  hasNewParams,
  initialScore,
}: Props) {
  const { t } = useTranslation();
  const [input, setInput] = useState(String(initialScore));

  const exScore = Number(input);
  const isValid = input !== "" && Number.isFinite(exScore) && exScore >= 0;

  const currentBpi = isValid
    ? legacyV1.chart({ notes, kaidenAvg, wrScore, coef }).bpi(exScore)
    : null;
  const newBpi =
    isValid && hasNewParams
      ? BpiCalculator.calc(exScore, { notes, kaidenAvg, wrScore, coef, mu, sigma, residualVar })
      : null;

  return (
    <DashCard>
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {t("newBpi.simulator.title")}
      </h3>
      <label className="mb-1 block text-xs text-muted-foreground">
        {t("newBpi.simulator.inputLabel")}
      </label>
      <Input
        type="number"
        min={0}
        max={notes * 2}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="mb-4 w-40"
      />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-muted-foreground">
            {t("newBpi.table.currentBpi")}
          </div>
          <div className="mt-1 text-2xl font-bold text-bpim-primary">
            {currentBpi !== null ? currentBpi.toFixed(2) : "—"}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">
            {t("newBpi.table.newBpi")}
          </div>
          <div className="mt-1 text-2xl font-bold text-amber-500">
            {newBpi !== null
              ? newBpi.toFixed(2)
              : hasNewParams
                ? "—"
                : t("newBpi.table.noParam")}
          </div>
        </div>
      </div>
    </DashCard>
  );
}
