import { DashCard } from "@/components/ui/dashcard";
import { useTranslation } from "@/hooks/common/useTranslation";

export interface FormulaSongInfo {
  m: number;
  kaidenAvg: number | null;
  wrScore: number | null;
  coef: number;
  mu: number | null;
  sigma: number | null;
  /** この曲の皆伝平均に対応するz値(BPI0のアンカー) */
  z0: number | null;
  /** この曲の全一に対応するz値(BPI100のアンカー) */
  z100: number | null;
}

/**
 * 選択中の楽曲について、現行方式・新方式それぞれの計算式に
 * 実際の定数(m/皆伝平均/全一/coef、mu/sigma/z0/z100)を当てはめて表示する。
 */
export default function FormulaCard({ m, kaidenAvg, wrScore, coef, mu, sigma, z0, z100 }: FormulaSongInfo) {
  const { t } = useTranslation();

  return (
    <DashCard>
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {t("newBpi.formula.title")}
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-semibold text-bpim-primary">
            {t("newBpi.formula.currentTitle")}
          </p>
          <pre className="overflow-x-auto rounded-md bg-bpim-surface-2 p-3 text-[11px] leading-relaxed whitespace-pre-wrap">
{`m = ${m} (ノーツ数×2)
皆伝平均 k = ${kaidenAvg ?? "—"}
全一 z = ${wrScore ?? "—"}
coef = ${coef}

PGF(j) = 1 + (j/m − 0.5) / (1 − j/m)
BPI(s) = sign(s−k) × 100 × |ln(PGF(s)/PGF(k)) / ln(PGF(z)/PGF(k))|^coef`}
          </pre>
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold text-amber-500">
            {t("newBpi.formula.newTitle")}
          </p>
          {mu !== null && sigma !== null && z0 !== null && z100 !== null ? (
            <pre className="overflow-x-auto rounded-md bg-bpim-surface-2 p-3 text-[11px] leading-relaxed whitespace-pre-wrap">
{`mu = ${mu}
sigma = ${sigma}
z0 = ${z0.toFixed(4)} (皆伝平均${kaidenAvg}のz値。BPI0のアンカー)
z100 = ${z100.toFixed(4)} (全一${wrScore}のz値。BPI100のアンカー)

t(s) = −ln(m − s)
z(s) = (t(s) − mu) / sigma
BPI(s) = 100 × (z(s) − z0) / (z100 − z0)　※下限−15でクランプ
※ BPI0=皆伝平均・BPI100=全一という原典の定義を崩さないよう、
　 z0/z100は全曲共通ではなくこの曲自身の値を使っている`}
            </pre>
          ) : (
            <p className="text-xs text-muted-foreground">
              {t("newBpi.formula.noParam")}
            </p>
          )}
        </div>
      </div>
    </DashCard>
  );
}
