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
 * 各曲（songId）について、指定時点（`targetTime`）以前に更新された最新の
 * songDefの`defId`を集計するサブクエリを組み立てる（`targetTime`省略時は
 * `isCurrent = 1`の行を対象とする）。
 *
 * `songId as l_defSongId` / `MAX(defId) as maxDefId` の2列を返す。
 * 呼び出し側は `songDef as sd` を `sd.defId = maxDefId` で結合して使う想定。
 *
 * @param targetTime - 基準時刻（省略時は現在有効な定義を対象にする）
 */
export function latestSongDefIdSubquery(targetTime?: Date) {
  const base = db
    .selectFrom("songDef")
    .select(["songId as l_defSongId", (eb) => eb.fn.max("defId").as("maxDefId")]);

  const filtered = targetTime
    ? base.where("updatedAt", "<=", targetTime)
    : base.where("isCurrent", "=", 1);

  return filtered.groupBy("songId");
}
