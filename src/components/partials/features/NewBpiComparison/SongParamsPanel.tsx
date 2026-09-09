import { ReactNode } from "react";
import { DashCard } from "@/components/ui/dashcard";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/common/useTranslation";
import InfoHint from "./InfoHint";

export interface SongParamsInfo {
  /** 現行方式の譜面係数。未設定曲は本番実装のデフォルト値。 */
  coef: number;
  /** ノーツ数×2（両方式共通の入力値）。 */
  m: number;
  /** 皆伝平均スコア（両方式共通の入力値）。 */
  kaidenAvg: number | null;
  /** 歴代全一スコア（両方式共通の入力値）。 */
  wrScore: number | null;
  /** 新方式: この曲のスコア分布の位置パラメータ。 */
  mu: number | null;
  /** 新方式: この曲のスコア分布の弁別力パラメータ。 */
  sigma: number | null;
  /** 新方式: mu/sigma の推定に使った観測数。 */
  n: number | null;
  /** 新方式: この曲の全一に対応する z 値（BPI100 アンカー）。 */
  z100: number | null;
  /** 新方式: この曲のカーブ指数（BPI↔順位が現行式に乗るようフィットした値）。 */
  k: number | null;
  /** 新方式: BPI0 アンカー（全曲共通の定数）。 */
  z0: number | null;
}

const ParamItem = ({
  label,
  hint,
  value,
  badge,
}: {
  label: string;
  hint: string;
  value: string;
  badge?: string;
}) => (
  <div className="flex flex-col gap-0.5 rounded-md bg-bpim-surface-2 p-2">
    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
      {label}
      <InfoHint label={label} text={hint} />
      {badge && (
        <Badge variant="outline" className="ml-auto text-[9px]">
          {badge}
        </Badge>
      )}
    </span>
    <span className="font-mono text-sm tabular-nums">{value}</span>
  </div>
);

const Group = ({
  title,
  titleClass,
  children,
}: {
  title: string;
  titleClass: string;
  children: ReactNode;
}) => (
  <>
    <p className={`mb-1 text-[11px] font-semibold ${titleClass}`}>{title}</p>
    <div className="mb-3 grid grid-cols-2 gap-2 last:mb-0 sm:grid-cols-3">
      {children}
    </div>
  </>
);

/**
 * 一覧のアコーディオン内で、その楽曲固有の数値（現行方式の係数・両方式共通の
 * 入力値・新方式の分布パラメータ）を一覧表示する。各ラベルの `?` から意味を
 * 確認できる。
 */
export default function SongParamsPanel({
  coef,
  m,
  kaidenAvg,
  wrScore,
  mu,
  sigma,
  n,
  z100,
  k,
  z0,
}: SongParamsInfo) {
  const { t } = useTranslation();

  const fmt = (value: number | null, digits = 4) => {
    if (value === null) return t("newBpi.params.noData");
    return Number.isInteger(value) ? String(value) : value.toFixed(digits);
  };

  return (
    <DashCard>
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {t("newBpi.params.title")}
      </h3>

      <Group title={t("newBpi.params.group.current")} titleClass="text-bpim-primary">
        <ParamItem
          label={t("newBpi.params.coef.label")}
          hint={t("newBpi.params.coef.hint")}
          value={fmt(coef)}
        />
      </Group>

      <Group
        title={t("newBpi.params.group.common")}
        titleClass="text-muted-foreground"
      >
        <ParamItem
          label={t("newBpi.params.m.label")}
          hint={t("newBpi.params.m.hint")}
          value={fmt(m)}
        />
        <ParamItem
          label={t("newBpi.params.kaidenAvg.label")}
          hint={t("newBpi.params.kaidenAvg.hint")}
          value={fmt(kaidenAvg)}
        />
        <ParamItem
          label={t("newBpi.params.wrScore.label")}
          hint={t("newBpi.params.wrScore.hint")}
          value={fmt(wrScore)}
        />
      </Group>

      <Group title={t("newBpi.params.group.new")} titleClass="text-amber-500">
        <ParamItem
          label={t("newBpi.params.mu.label")}
          hint={t("newBpi.params.mu.hint")}
          value={fmt(mu)}
        />
        <ParamItem
          label={t("newBpi.params.sigma.label")}
          hint={t("newBpi.params.sigma.hint")}
          value={fmt(sigma)}
        />
        <ParamItem
          label={t("newBpi.params.n.label")}
          hint={t("newBpi.params.n.hint")}
          value={fmt(n)}
        />
        <ParamItem
          label={t("newBpi.params.z100.label")}
          hint={t("newBpi.params.z100.hint")}
          value={fmt(z100)}
        />
        <ParamItem
          label={t("newBpi.params.k.label")}
          hint={t("newBpi.params.k.hint")}
          value={fmt(k)}
        />
        <ParamItem
          label={t("newBpi.params.z0.label")}
          hint={t("newBpi.params.z0.hint")}
          value={fmt(z0)}
          badge={t("newBpi.params.sharedConstant")}
        />
      </Group>
    </DashCard>
  );
}
