import { DashCard } from "@/components/ui/dashcard";
import { useTranslation } from "@/hooks/common/useTranslation";

export interface FormulaSongInfo {
  m: number;
  kaidenAvg: number | null;
  wrScore: number | null;
  coef: number;
  mu: number | null;
  sigma: number | null;
  /** 全曲共通のBPI0アンカー(issue #302の提案通り、皆伝平均のz位置の全曲中央値) */
  z0: number | null;
  /** この曲の全一に対応するz値(BPI100のアンカー。原典の定義維持のため曲ごと) */
  z100: number | null;
  /** 曲間のカーブの歪みを補正する指数。全曲同じ式(gammaFor)で算出する。 */
  gamma: number | null;
}

/**
 * 選択中の楽曲について、現行方式・新方式それぞれの計算式に
 * 実際の定数(m/皆伝平均/全一/coef、mu/sigma/z0/z100/gamma)を当てはめて表示する。
 */
export default function FormulaCard({ m, kaidenAvg, wrScore, coef, mu, sigma, z0, z100, gamma }: FormulaSongInfo) {
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
          {mu !== null &&
          sigma !== null &&
          z0 !== null &&
          z100 !== null &&
          gamma !== null ? (
            <pre className="overflow-x-auto rounded-md bg-bpim-surface-2 p-3 text-[11px] leading-relaxed whitespace-pre-wrap">
{`mu = ${mu}
sigma = ${sigma}
z0 = ${z0.toFixed(4)} (全曲共通。皆伝平均のz位置の中央値。BPI0のアンカー)
z100 = ${z100.toFixed(4)} (この曲の全一${wrScore}のz値。BPI100のアンカー)
gamma = ${gamma.toFixed(4)} (全曲共通の式で算出。1.0000なら曲間の歪み補正なし)

t(s) = −ln(m − s)
z(s) = (t(s) − mu) / sigma
BPI(s) = sign(z−z0) × 100 × |(z(s) − z0) / (z100 − z0)|^gamma　※下限−15でクランプ
※ BPI100=全一という原典の定義は曲ごとに維持しつつ、BPI0はissue #302の
　 提案通り全曲共通の定数を使うハイブリッド。gammaは「全一が曲間で極端に
　 遠い/近い」ことで生じるカーブの歪みを補正する指数で、全曲同じ式
　 (基準プレイヤーz_refが典型的な曲と同じBPIになるよう解析的に決定)から
　 算出する。曲ごとに式自体を変えているわけではない`}
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
