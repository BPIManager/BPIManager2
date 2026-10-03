import { tOf } from "@bpim/bpicalc";
import { NEW_BPI_RESIDUAL_RMSE } from "@/constants/iidx/newBpi/modelConstants";
import type { RadarCategory } from "@/types/stats/radar";

const GLOBAL_RESIDUAL_VARIANCE = NEW_BPI_RESIDUAL_RMSE * NEW_BPI_RESIDUAL_RMSE;

interface VarianceSong {
  songId: number;
  mu?: number | null;
  sigma?: number | null;
  notes: number;
  residualVar?: number | null;
  radarCategory: RadarCategory | null;
}

interface Contribution {
  numTerm: number;
  infoTerm: number;
  category: RadarCategory | null;
}

/**
 * プレイヤーの潜在スキル a_shrunk（全体・カテゴリ別）を観測追加ごとにO(1)で増分更新する。
 * 数式は docs/bpi-math.md §7.5 と @bpim/bpicalc の PlayerBpiV2 に一字一句対応させる。categoryBias は生の重み付き和を保持し、参照時に組み立てる。
 */
export class LatentSkillModel {
  private num = 0;
  private info = 0;
  private readonly categoryNum = new Map<RadarCategory, number>();
  private readonly categoryInfo = new Map<RadarCategory, number>();
  /** songId -> 直近の寄与。同じ曲の観測が更新された場合に差し替えるために保持する。 */
  private readonly contributions = new Map<number, Contribution>();

  /**
   * 曲の観測（実測 or 仮想プレイの EX スコア）を追加・更新する。同じ songId の既存観測は寄与を差し引いてから新しい寄与を加える。
   * mu/sigma が無い・notes=0 の曲は V2 のスコープ外として無視する（@bpim/bpicalc と同じ扱い）。
   */
  upsert(song: VarianceSong, exScore: number): void {
    const { mu, sigma, notes, songId } = song;
    if (mu == null || sigma == null || notes === 0) return;

    const prev = this.contributions.get(songId);
    if (prev) this.applyDelta(prev, -1);

    const ev = song.residualVar ?? GLOBAL_RESIDUAL_VARIANCE;
    const t = tOf(exScore, notes * 2);
    const contribution: Contribution = {
      numTerm: (sigma * (t - mu)) / ev,
      infoTerm: (sigma * sigma) / ev,
      category: song.radarCategory,
    };
    this.applyDelta(contribution, 1);
    this.contributions.set(songId, contribution);
  }

  private applyDelta(c: Contribution, sign: 1 | -1): void {
    this.num += sign * c.numTerm;
    this.info += sign * c.infoTerm;
    if (c.category) {
      this.categoryNum.set(c.category, (this.categoryNum.get(c.category) ?? 0) + sign * c.numTerm);
      this.categoryInfo.set(c.category, (this.categoryInfo.get(c.category) ?? 0) + sign * c.infoTerm);
    }
  }

  /** プレイヤーの潜在スキル（縮小推定 a_shrunk）。観測が1件も無ければ`null`。 */
  get aShrunk(): number | null {
    return this.info > 0 ? this.num / (this.info + 1) : null;
  }

  /** 全体の信頼度 `w = info/(info+1)`（事後分散`1/(info+1)`の補数）。 */
  get confidence(): number {
    return this.info / (this.info + 1);
  }

  /** カテゴリ`category`の得意・不得意バイアス`categoryBias_c`。現在の`aShrunk`を使って都度計算する。 */
  categoryBias(category: RadarCategory): number {
    const aShrunk = this.aShrunk;
    if (aShrunk == null) return 0;
    const infoC = this.categoryInfo.get(category) ?? 0;
    const numC = this.categoryNum.get(category) ?? 0;
    return (numC - aShrunk * infoC) / (infoC + 1);
  }

  /** カテゴリ`category`の信頼度 `w_c = info_c/(info_c+1)`（`ColdStartGuard`が使う）。 */
  categoryConfidence(category: RadarCategory): number {
    const infoC = this.categoryInfo.get(category) ?? 0;
    return infoC / (infoC + 1);
  }
}
