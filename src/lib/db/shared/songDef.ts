import { db } from "@/lib/db";

/**
 * 現在有効な songDef（isCurrent = 1）に絞り込むサブクエリの基点。呼び出し側で select を続けて as(alias) し、JOIN に渡す。
 */
export function currentSongDefSubquery() {
  return db.selectFrom("songDef").where("isCurrent", "=", 1);
}

/**
 * 各曲の現在有効（isCurrent = 1）な songDef の defId を集計するサブクエリ（songId と maxDefId の2列）。
 * wrScore/kaidenAvg/coef/mu/sigma/residualVar は過去時点の定義を再現せず常に最新を参照する（再計算が最新定義を前提とするため）。
 */
export function latestSongDefIdSubquery() {
  return db
    .selectFrom("songDef")
    .select(["songId as l_defSongId", (eb) => eb.fn.max("defId").as("maxDefId")])
    .where("isCurrent", "=", 1)
    .groupBy("songId");
}
