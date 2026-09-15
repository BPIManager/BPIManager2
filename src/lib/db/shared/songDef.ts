import { db } from "@/lib/db";

/**
 * 現在有効な songDef（`isCurrent = 1`）に絞り込むサブクエリのベースを組み立てる。
 *
 * 呼び出し側で必要な `.select([...])` を続けた上で `.as(alias)` して
 * `leftJoin`/`innerJoin` に渡す。
 */
export function currentSongDefSubquery() {
  return db.selectFrom("songDef").where("isCurrent", "=", 1);
}

/**
 * 各曲（songId）について、現在有効（`isCurrent = 1`）なsongDefの`defId`を
 * 集計するサブクエリを組み立てる。
 *
 * `songId as l_defSongId` / `MAX(defId) as maxDefId` の2列を返す。
 * 呼び出し側は `songDef as sd` を `sd.defId = maxDefId` で結合して使う想定。
 *
 * wrScore/kaidenAvg/coef/mu/sigma/residualVarはいずれも、過去のある時点の
 * songDefを再現するのではなく常に最新の定義を参照する（forceBPIUpdate等が
 * 既存スコアのbpiを最新の定義で再計算し続けるため、historicalなsongDefを
 * 引いても実態のbpiとは整合しない）。
 */
export function latestSongDefIdSubquery() {
  return db
    .selectFrom("songDef")
    .select(["songId as l_defSongId", (eb) => eb.fn.max("defId").as("maxDefId")])
    .where("isCurrent", "=", 1)
    .groupBy("songId");
}
