import type { ScoreFilterCondition } from "@/types/songs/score";

/** 分布の上端を含めない区間 [from, to) を、以下判定のフィルタで表すための微小値 */
const EXCLUSIVE_EPSILON = 0.0001;

type ListFilterQuery = Record<string, string>;

const scoreFilters = (conds: Omit<ScoreFilterCondition, "id">[]): string =>
  JSON.stringify(conds.map((c, i) => ({ ...c, id: `dash-${i}` })));

/**
 * DJ RANK 分布の1区間（ランク名）に該当する譜面だけを出すスコア一覧のクエリを作る。
 *
 * @param rank - 分布のラベル（`RANK_TABLE` のランク名）
 */
export function rankListQuery(rank: string): ListFilterQuery {
  return {
    scoreFilters: scoreFilters([{ metric: "djrank", operator: "=", value: rank }]),
  };
}

/**
 * スコアレート分布の1区間に該当する譜面だけを出すクエリを作る。
 *
 * @param label - 分布のラベル（区間の下端%。"100" は理論値のみ）
 * @param step - 分布の刻み幅(%)
 */
export function scoreRateListQuery(label: string, step: number): ListFilterQuery {
  const from = Number(label);
  if (Number.isNaN(from)) return {};
  if (from >= 100) {
    return { scoreFilters: scoreFilters([{ metric: "scoreRate", operator: ">=", value: "100" }]) };
  }
  const to = Math.min(from + step, 100);
  return {
    scoreFilters: scoreFilters([
      { metric: "scoreRate", operator: ">=", value: String(from) },
      { metric: "scoreRate", operator: "<=", value: String(to - EXCLUSIVE_EPSILON) },
    ]),
  };
}

/**
 * BPI分布の1区間に該当する譜面だけを出すクエリを作る。BPIは小数第2位まで保存されるため、上端未満は「上端 − 0.01 以下」で表す。
 *
 * @param label - 分布のラベル（`"<-10"`・区間の下端・`"100+"`）
 * @param step - 分布の刻み幅
 */
export function bpiListQuery(label: string, step: number): ListFilterQuery {
  const below = (to: number) => ({ metric: "bpi" as const, operator: "<=" as const, value: String(Math.round((to - 0.01) * 100) / 100) });
  if (label === "<-10") return { scoreFilters: scoreFilters([below(-10)]) };
  if (label === "100+") {
    return { scoreFilters: scoreFilters([{ metric: "bpi", operator: ">=", value: "100" }]) };
  }
  const from = Number(label);
  if (Number.isNaN(from)) return {};
  const to = Math.min(from + step, 100);
  return {
    scoreFilters: scoreFilters([
      { metric: "bpi", operator: ">=", value: String(from) },
      below(to),
    ]),
  };
}
