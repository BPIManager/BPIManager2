import { db } from "@/lib/db";
import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import {
  songRankingCacheRepo,
  type NewSongRankingCache,
} from "@/lib/db/domains/songRankingCache";

/**
 * 指定バージョンの楽曲別ランキング（各ユーザーの最新スコアに基づく曲ごとの順位・総プレイヤー数）を
 * 全ユーザー分まとめて1回のクエリで算出する。
 *
 * `songRankingCache` はリクエストしたユーザーに依存しない全ユーザー共通のデータのため、
 * ユーザーごとに都度算出するのではなく、ここで全ユーザー分を一括算出してキャッシュへ書き込む。
 */
async function calculateSongRankingForVersion(
  version: string,
): Promise<NewSongRankingCache[]> {
  const rows = await db
    .with("per_song_latest", (db) =>
      db
        .selectFrom("allScores as s")
        .innerJoin(
          (qb) =>
            qb
              .selectFrom("allScores")
              .select([
                "userId",
                "songId",
                (eb) => eb.fn.max("logId").as("maxLogId"),
              ])
              .where("version", "=", version)
              .groupBy(["userId", "songId"])
              .as("m"),
          (join) =>
            join
              .onRef("m.maxLogId", "=", "s.logId")
              .onRef("m.userId", "=", "s.userId")
              .onRef("m.songId", "=", "s.songId"),
        )
        .select((eb) => [
          "s.userId",
          "s.songId",
          eb.fn
            .agg<number>("rank", [])
            .over((ob) =>
              ob.partitionBy("s.songId").orderBy("s.exScore", "desc"),
            )
            .as("rnk"),
          eb.fn
            .countAll<number>()
            .over((ob) => ob.partitionBy("s.songId"))
            .as("totalPlayers"),
        ]),
    )
    .selectFrom("per_song_latest")
    .selectAll()
    .execute();

  return rows.map((r) => ({
    userId: r.userId,
    version,
    songId: r.songId,
    rank: Number(r.rnk),
    totalPlayers: Number(r.totalPlayers),
  }));
}

/**
 * 全バージョンの楽曲別ランキングキャッシュ（`songRankingCache` テーブル）を最新スコアで更新する。
 *
 * バージョンごとに全ユーザー分の順位・総プレイヤー数を1回のクエリでまとめて算出し、
 * bulk UPSERTで書き込む。スコアが存在しないバージョンはスキップする。
 */
export async function updateAllSongRankingCache() {
  for (const version of IIDX_VERSIONS) {
    const rows = await calculateSongRankingForVersion(version);

    if (rows.length === 0) {
      console.log(`[SongRanking] version ${version}: no scores, skipping`);
      continue;
    }

    console.log(
      `[SongRanking] version ${version}: writing ${rows.length} rows...`,
    );
    await songRankingCacheRepo.bulkUpsert(rows);
  }

  console.log("[SongRanking] Cache update done for all versions");
}
