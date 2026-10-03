import fs from "fs/promises";
import path from "path";
import { usersRepo } from "@/lib/db/domains/users";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { ARENA_RANK_ORDER } from "@/constants/iidx/arenaRanks";
import { upsertOfficialArenaStats } from "@/lib/db/domains/arenaHistory";
import type { IIDXVersion } from "@/types/iidx/version";
import { GRADE_IDS, getUrls, acquireSessionCookie, fetchGrade, normalizeId } from "@/lib/cron/arena/eagate";
import { getOutputFile, getMetricsDir, PlayerRecord, getPlayersFile, getActiveFile, getActiveBackupFile, loadPlayersSnapshot, computeActiveByClass, roundTo15Min } from "@/lib/cron/arena/snapshot";

export async function fetchOfficialArenaDistribution(
  version: IIDXVersion = latestVersion,
) {
  console.log(`[OfficialArena] version=${version} Acquiring session cookie...`);
  // 前回スナップショットをロード（差分計算用）
  const prevSnapshot = await loadPlayersSnapshot(version);
  const { sessionUrl, rankingUrl } = getUrls(version);
  const outputFile = getOutputFile(version);
  const metricsDir = getMetricsDir(version);

  const cookie = await acquireSessionCookie(sessionUrl);
  if (!cookie) {
    console.warn("[OfficialArena] Failed to acquire session cookie, skipping.");
    return;
  }
  console.log(
    `[OfficialArena] Session acquired (${cookie.split(";").length} cookies). Fetching all grade_ids...`,
  );

  const results = await Promise.all(
    GRADE_IDS.map((id) => fetchGrade(id, cookie, rankingUrl, sessionUrl)),
  );

  const playerClassMap = new Map<string, string>();
  for (const list of results) {
    for (const p of list) {
      playerClassMap.set(normalizeId(p.id), p.arena_class.toUpperCase());
    }
  }

  const users = await usersRepo.getUsersWithIidxId();

  const fetchedAt = roundTo15Min(new Date());
  const rawByNormalizedId = new Map<string, (typeof results)[0][0]>();
  for (const list of results) {
    for (const p of list) {
      rawByNormalizedId.set(normalizeId(p.id), p);
    }
  }

  const countMap = new Map<string, number>();
  const statsRecords: Parameters<typeof upsertOfficialArenaStats>[0] = [];

  for (const user of users) {
    if (!user.iidxId) continue;
    const nid = normalizeId(user.iidxId);
    const arenaClass = playerClassMap.get(nid);
    if (arenaClass) {
      countMap.set(arenaClass, (countMap.get(arenaClass) ?? 0) + 1);
    }
    const raw = rawByNormalizedId.get(nid);
    if (raw) {
      statsRecords.push({
        userId: user.userId,
        version,
        area: raw.area ?? null,
        arenaClass: raw.arena_class.toUpperCase(),
        gradeSp: raw.grade_sp || null,
        gradeDp: raw.grade_dp || null,
        arenaRank: typeof raw.rank === "number" ? raw.rank : null,
        wins: (() => {
          const n = parseInt(raw.win ?? "");
          return isNaN(n) ? null : n;
        })(),
        a1continue: raw.a1continue || null,
        fetchedAt,
      });
    }
  }

  const { inserted, skipped } = await upsertOfficialArenaStats(statsRecords);
  console.log(
    `[OfficialArena] DB upsert: inserted=${inserted}, skipped=${skipped}`,
  );

  // eAMU全プレイヤーのランク分布（カバー率の分母）
  const allPlayersCountMap = new Map<string, number>();
  for (const arenaClass of playerClassMap.values()) {
    allPlayersCountMap.set(
      arenaClass,
      (allPlayersCountMap.get(arenaClass) ?? 0) + 1,
    );
  }
  const distribution = ARENA_RANK_ORDER.map((rank) => ({
    rank,
    count: allPlayersCountMap.get(rank) ?? 0,
  }));

  // BPIM2ユーザーの照合数（カバー率の分子合計）
  const totalMatched = [...countMap.values()].reduce((s, c) => s + c, 0);

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const metricsFile = path.join(metricsDir, `${dateStr}.json`);

  await fs.mkdir(metricsDir, { recursive: true });
  await fs.writeFile(
    metricsFile,
    JSON.stringify(
      {
        fetchedAt: now.toISOString(),
        grades: GRADE_IDS.map((id, i) => ({
          grade_id: id,
          players: results[i],
        })),
      },
      null,
      2,
    ),
  );

  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  await fs.writeFile(
    outputFile,
    JSON.stringify({
      distribution,
      totalMatched,
      totalPlayers: playerClassMap.size,
      generatedAt: now.toISOString(),
    }),
  );

  // 今回の全プレイヤースナップショットを構築
  const currentPlayers: PlayerRecord[] = Array.from(rawByNormalizedId.entries()).map(
    ([id, p]) => ({
      id,
      c: p.arena_class.toUpperCase(),
      w: parseInt(p.win ?? "0") || 0,
    }),
  );

  // 前回との差分からアクティブプレイヤー数を算出して保存
  const activeByClass = computeActiveByClass(prevSnapshot, currentPlayers);
  const activePayload = JSON.stringify({
    generatedAt: now.toISOString(),
    prevFetchedAt: prevSnapshot?.fetchedAt ?? null,
    byClass: activeByClass,
  });

  // 上書き前に旧データをバックアップ(失敗しても本処理は継続してよいベストエフォート)
  if (prevSnapshot?.fetchedAt) {
    const backupFile = getActiveBackupFile(version, prevSnapshot.fetchedAt, now.toISOString());
    await fs.mkdir(path.dirname(backupFile), { recursive: true });
    await fs.writeFile(backupFile, activePayload).catch(() => {});
  }

  await fs.writeFile(getActiveFile(version), activePayload);

  // 今回スナップショットを保存（次回の prev として使用）
  await fs.writeFile(
    getPlayersFile(version),
    JSON.stringify({ fetchedAt: now.toISOString(), players: currentPlayers }),
  );

  console.log(
    `[OfficialArena] Done. version=${version} Matched ${totalMatched}/${users.length} users (${playerClassMap.size} in rankings). Active: ${Object.values(activeByClass).reduce((a, b) => a + b, 0)}`,
  );
}
